export enum Source {
  fromMethod,
  fromEmit,
  fromWatch
}

export const fromMethod = name => {
  const config = {
    type: Source.fromMethod,
    name
  }

  return name ? () => config : config
}

export const fromWatch = name => {
  const config = {
    type: Source.fromWatch,
    name
  }

  return name ? () => config : config
}

export const fromEmit = name => {
  const config = {
    type: Source.fromWatch,
    name
  }

  return name ? () => config : config
}

function VueStreams(Vue, { Subject, BehaviorSubject }) {
  Vue.mixin({
    created() {
      const vm = this
      vm._streamKeysToDelete = []
      vm._streamKeysToUnwatch = []
      vm._streamKeysToOff = []

      const sourcesConfig = {}
      const { sources = {}, subscriptions } = vm.$options as any
      if (sources) {
        Object.keys(sources).forEach(sourceName => {
          if (typeof sources[sourceName] === "function") {
            const { type, name = sourceName } = sources[sourceName]()
            switch (type) {
              case Source.fromMethod:
                const methodSubject = (sourcesConfig[
                  sourceName
                ] = new Subject())

                vm._streamKeysToDelete.push(name)
                vm[name] = methodSubject.next.bind(methodSubject)
                break
              case Source.fromWatch:
                if (!vm[name]) {
                  vm._streamKeysToDelete.push(name)
                  ;(Vue as any).util.defineReactive(vm, name, undefined)
                }
                const watchSubject = (sourcesConfig[
                  sourceName
                ] = new BehaviorSubject(vm[name]))
                vm._streamKeysToUnwatch.push(
                  vm.$watch(name, watchSubject.next.bind(watchSubject))
                )
                break
              case Source.fromEmit:
                const emitSubject = (sourcesConfig[sourceName] = new Subject())

                vm._streamKeysToDelete.push(name)
                vm[name] = emitSubject.next.bind(emitSubject, event)
                vm.$on(name, emitSubject.next.bind(emitSubject))
                vm._streamKeysToOff.push(name)
                break
            }
          }
        })
      }

      if (subscriptions) {
        Object.keys(subscriptions).map(key => {
          vm._streamKeysToDelete.push(key)
          ;(Vue as any).util.defineReactive(vm, key, undefined)
        })
      }

      if (subscriptions) {
        const subs = subscriptions(sourcesConfig)
        vm._subscriptions = Object.keys(subs).map(key => {
          ;(Vue as any).util.defineReactive(vm, key, undefined)

          return subs[key].subscribe(value => {
            vm[key] = value
          })
        })
      }
    },
    beforeDestroy() {
      const vm = this
      const { _subscriptions } = vm
      if (_subscriptions) {
        _subscriptions.forEach(sub => sub.unsubscribe())
      }

      vm._streamKeysToDelete.forEach(key => delete vm[key])
      vm._streamKeysToUnwatch.forEach(unwatch => unwatch())
      vm._streamKeysToOff.forEach(event => vm.$off(event))
    }
  })
}

export default VueStreams
