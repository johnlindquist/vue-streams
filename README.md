# Vue Streams ⛲️

A simplified approach to using Streams with Vue.

## Setup

```js
import VueStreams from "vue-streams"
import { Subject, BehaviorSubject } from "rxjs"
Vue.use(VueStreams, { Subject, BehaviorSubject })
```

## Usage

### Simple Example

[![Simple Example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/yv37425lox)

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

### Standard Example

[![Standard Example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/ov6yk15w26)

```js
<template>
  <div id="demo">
    <label>Search <input type="text" v-model="term"></label>
    <button @click="term = ''">Clear</button>
    <transition-group tag="div" name="fade" class="people">
      <div v-for="person of people$" :key="person.id">
        <h2>{{person.name}}</h2>
        <img :src="`${URL}/${person.image}`" alt="">
      </div>
    </transition-group>
  </div>
</template>
<script>
import { fromWatch } from "vue-streams";
import { merge } from "rxjs";
import { switchMap, map, pluck, partition } from "rxjs/operators";
import { ajax } from "rxjs/ajax";

const URL = `https://foamy-closet.glitch.me`;

export default {
  data() {
    return { URL, term: "sky" };
  },
  sources: {
    term$: fromWatch("term")
  },
  subscriptions: {
    people$: ({ term$ }) => {
      const [search$, empty$] = term$.pipe(partition(term => term.length));

      return merge(
        search$.pipe(
          switchMap(term =>
            ajax(`${URL}/people?name_like=${term}`).pipe(pluck("response"))
          )
        ),
        empty$.pipe(map(() => []))
      );
    }
  }
};
</script>
<style>
#demo {
  font-family: "Avenir";
}
.people {
  display: flex;
  flex-wrap: wrap;
}

.people > *{
  padding: .25rem;
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

### Crazy Example

[![Crazy Example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/48jyk13nm7)

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
    one$: fromMethod, //infer method name from key
    two$: fromMethod("two"), //manually map method name
    load$: fromMethod,
    enter$: fromMethod,
    text$: fromWatch("text") //manually map data property
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
