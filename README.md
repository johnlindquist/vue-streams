# Vue Streams ⛲️

A simplified approach to using Streams with Vue.

## Setup

```js
import VueStreams from "vue-streams"
Vue.use(VueStreams)
```

## Usage

### Simple Example

```js
<template>
  <div>
    <button @click="click$">Click me</button>
    {{random$}}
  </div>
</template>
<script>
import { fromMethod } from "vue-streams"
import { map } from "rxjs/operators"

export default {
  sources: {
    click$: fromMethod
  },
  subscriptions: {
    random$: ({ click$ }) => click$.pipe(map(() => Math.random()))
  }
}
</script>
```

### Crazy Example

```js
<template>
  <div id="demo">
    <button @click="one$">One</button>
    <button @click="two">Two</button>
    <button @click="load$">Load Random</button>
    <input type="text" v-model="text">
    <button v-on:click="show = !show">
      Toggle
    </button>
    <transition name="fade" @enter="enter$">
      <p v-if="show">hello</p>
    </transition>
    <h2>
      {{message$}}
    </h2>
  </div>
</template>
<script>
import { merge, interval } from "rxjs"
import { ajax } from "rxjs/ajax"
import { map, mapTo, switchMap, pluck } from "rxjs/operators"
import { fromMethod, fromWatch } from "vue-streams"

export default {
  data() {
    return {
      show: false,
      text: "john"
    }
  },
  sources: {
    one$: fromMethod,
    two$: () => fromMethod("two"),
    load$: fromMethod,
    enter$: fromMethod,
    text$: () => fromWatch("text")
  },
  streams: {
    buttons$: ({ one$, two$, enter$ }) =>
      merge(
        one$.pipe(mapTo(1)),
        two$.pipe(mapTo(2)),
        enter$.pipe(mapTo("fade in..."))
      ),
    date$: () => interval(4000).pipe(map(() => new Date().toString())),
    person$: ({ load$ }) =>
      load$.pipe(
        switchMap(() =>
          ajax(
            `https://foamy-closet.glitch.me/people/${Math.floor(
              Math.random() * 10
            )}`
          ).pipe(pluck("response", "name"))
        )
      )
  },
  subscriptions: {
    message$: ({ text$, buttons$, date$, person$ }) =>
      merge(person$, text$, date$, buttons$)
  }
}
</script>
<style>
#demo {
  font-family: "Avenir";
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
```
