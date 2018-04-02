# ⛲️ vue-streams ⛲️

A simplified approach to using Streams with Vue.

## Install

```bash
npm i vue-streams rxjs@rc
```

rxjs v6 is recommended (current in Release Candidate)

## Setup

In your `main.js`

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
import { fromMethod } from "vue-streams";
import { map } from "rxjs/operators";

export default {
  sources: {
    click$: fromMethod
  },
  subscriptions: ({ click$ }) => ({
    random$: click$.pipe(map(() => Math.random()))
  })
};
</script>
```

### Standard Example

[![Standard Example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/ov6yk15w26)

```js
<template>
  <div id="demo">
    <label>Search <input type="text" v-model="term"></label>
    <button @click="term = ''">Clear</button>
    <h2 v-if="noResults$">
      {{message$}}
    </h2>
    <transition-group tag="div" name="fade" class="people">
      <div v-for="person of people$" :key="person.id">
        <h2>{{person.name}}</h2>
        <img :src="`${URL}/${person.image}`" alt="">
      </div>

    </transition-group>

  </div>
</template>
<script>
import { fromWatch } from "vue-streams"
import { merge } from "rxjs"
import {
  switchMap,
  map,
  mapTo,
  pluck,
  partition,
  debounceTime,
  share
} from "rxjs/operators"
import { ajax } from "rxjs/ajax"

const URL = `https://foamy-closet.glitch.me`

export default {
  data() {
    return { URL, term: "sky" }
  },
  sources: {
    term$: fromWatch("term")
  },
  subscriptions: ({ term$ }) => {
    const [search$, empty$] = term$.pipe(
      debounceTime(250),
      partition(term => term.length)
    )

    const people$ = merge(
      search$.pipe(
        switchMap(term =>
          ajax(`${URL}/people?name_like=${term}`).pipe(
            share(),
            pluck("response")
          )
        )
      ),
      empty$.pipe(map(() => []))
    )

    const noResults$ = people$.pipe(map(result => result.length === 0))
    const message$ = merge(
      noResults$.pipe(mapTo("No results 😢")),
      empty$.pipe(mapTo("Please type something 👍"))
    )

    return { people$, noResults$, message$ }
  }
}
</script>
<style>
#demo {
  font-family: "Avenir";
}
.people {
  display: flex;
  flex-wrap: wrap;
}

.people > * {
  padding: 0.25rem;
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
import { merge, interval } from "rxjs";
import { ajax } from "rxjs/ajax";
import { map, mapTo, switchMap, pluck } from "rxjs/operators";
import { fromMethod, fromWatch } from "vue-streams";

export default {
  data() {
    return {
      show: false,
      text: "john"
    };
  },
  sources: {
    one$: fromMethod,
    two$: fromMethod("two"),
    load$: fromMethod,
    enter$: fromMethod,
    text$: fromWatch("text")
  },

  subscriptions: ({ one$, two$, load$, enter$, text$ }) => {
    const buttons$ = merge(
      one$.pipe(mapTo(1)),
      two$.pipe(mapTo(2)),
      enter$.pipe(mapTo("fade in..."))
    );
    const date$ = interval(4000).pipe(map(() => new Date().toString()));
    const person$ = load$.pipe(
      switchMap(() =>
        ajax(
          `https://foamy-closet.glitch.me/people/${Math.floor(
            Math.random() * 10
          )}`
        ).pipe(pluck("response", "name"))
      )
    );

    const message$ = merge(person$, text$, date$, buttons$);

    return {
      message$
    };
  }
};
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
