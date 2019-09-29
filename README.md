# Universal React RxJS

Create **universal** web apps with **React** and **RxJS**.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/universal-react-rxjs/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/universal-react-rxjs.svg?style=flat)](https://www.npmjs.com/package/universal-react-rxjs)
![npm](https://img.shields.io/npm/dw/universal-react-rxjs.svg)
[![Build Status](https://travis-ci.org/steve-taylor/universal-react-rxjs.svg?branch=develop)](https://travis-ci.org/steve-taylor/universal-react-rxjs)
[![PRs Welcome](https://img.shields.io/badge/pull_requests-welcome-brightgreen.svg)](https://github.com/universal-react-rxjs/blob/master/CONTRIBUTING.md)

## Installation

Universal React RxJS requires **React 16.8.3 or later** and **RxJS 6.0.0 or
later**.

```
npm i -S universal-react-rxjs
```

## Configure the build

**Important:** The `universal-react-rxjs` package **is not transpiled!** Your
project must transpile it.

See [Webpack](docs/webpack.md) or [Browserify](docs/browserify.md)
instructions.

## What it does

Universal React RxJS connects an **observable** to a **component** to create a
**widget**.

A widget is a React component whose state is managed by an RxJS observable.

Widgets can also be server-side rendered asynchronously, even if they have
ancestor widgets and/or descendant widgets.

Server-side rendered widgets can be hydrated, with the initial state provided
by the server, so that the browser doesn't have to call any endpoints for the
initial render.

## Comparison to React Redux

Universal React RxJS is an alternative to React Redux, using RxJS as the
state manager instead of Redux.

The two libraries have some key differences:

|                                | React Redux                    | Universal React RxJS         |
|--------------------------------|--------------------------------|------------------------------|
| Multiple stores/observables    | Discouraged                    | Unopinionated                |
| Relationship to component tree | Decoupled                      | Attached to a component      |
| Asynchronous state change      | Requires third-party libraries | Built-in                     |
| Server-side rendering          | No                             | Yes                          |

## Usage

Create a context to connect an RxJS observable to your React component:

```js
// profile-context.js

import React from 'react';

export default React.createContext(null);
```

Create your React component hierarchy, connecting your context to it using
`<Inject context={yourContext} />`:

```jsx harmony
// profile.js

import React from 'react';
import {Inject} from 'universal-react-rxjs';
import profileContext from './profile-context';

function ProfileName() {
    return (
        <section className="profile__name">
            <Inject
                context={profileContext}
                compare={['isLoading', 'name']}
            >
                {({isLoading, name}) => (
                    isLoading ? (
                        <em>
                            Loading...
                        </em>
                    ) : (
                        name
                    )
                )}
            </Inject>
        </section>
    );
}

function ProfilePhoto() {
    return (
        <section className="profile__photo">
            <Inject context={profileContext}>
                {({isLoading, photo}) => (
                    <img
                        className="profile__photo-img"
                        src={isLoading ? '/static/img/profile-loading.gif' : photo}
                        alt={isLoading ? 'Loading profile' : 'Profile photo'}
                    />
                )}
            </Inject>
        </section>
    );
}

export default function Profile() {
    return (
        <section className="profile">
            <ProfileName />
            <ProfilePhoto />
        </section>
    );
}
```

NOTE: `compare` specifies how to skip widget states that are duplicates with
respect to the subset of the state being used. Typically, this is just a list
of the widget state properties being used. However, you can instead specify a
function that compares consecutive widget states for equality.

Define your component's event stream and create a widget:

```js
// profile-widget.js
import {combineLatest, of as observableOf} from 'rxjs';
import {map, skip, startWith, switchMap} from 'rxjs/operators';
import {widget} from 'universal-react-rxjs';
import component from './profile';
import context from './profile-context';
import fetchName from './streams/fetch-name';
import fetchPhoto from './streams/fetch-photo';

export default widget({
    name: 'profile',
    component,
    context,
    getData: (props$, hydration, immediate) => {
        const userId$ = props$.map(({userId}) => userId);

        const name$ = hydration
            ? observableOf({name: hydration.name})
            : userId$.pipe(switchMap(fetchName));

        const photo$ = hydration
            ? observableOf({photo: hydration.photo})
            : userId$.pipe(switchMap(fetchPhoto));

        return combineLatest([name$, photo$]).pipe(
            map(([name, photo]) => ({
                // React component rendered with this state as its props
                state: {name, photo},
                // Hydration data rendered alongside the React element in the HTML page
                hydration: {name, photo},
                // Additional data accumulated during server-side rendering
                data: {maxAge: 60},
            })),
            // Start with a loading state ...
            startWith({
                state: {isLoading: true},
            }),
            // ... but skip it if an immediate value isn't required
            skip(immediate ? 0 : 1)
        );
    },
});
```

The general contract of `getData(props$, hydration, immediate)` is:

* Return an RxJS `Observable` that emits objects of the form
  `{state, hydration, data}` where both `state` and `hydration` are objects and
  `data` is any additional data you want to accumulate during server-side
  rendering.
* If the third parameter (`immediate`) provided to `getData` is `true`, the
  observable is expected to immediately produce an event.
* Events must contain `hydration` during server-side rendering.
* Events can contain `hydration` and/or `data` client-side, but it will have no
  effect.
* Keep hydration small to keep server-side rendered HTML pages small. Only
  attach the minimum amount of data required to hydrate widgets without them
  having to fetch data from APIs.

Somewhere on the server:

```jsx harmony
import React from 'react';
import {renderToHtml} from 'universal-react-rxjs';
import ProfileWidget from './profile-widget';

// Server-side render an HTML page consisting of the profiles from a list of
// user IDs.
async function renderUserProfilesPage(userIds) {
    let maxAge = 60; // Default max-age to 60s

    // Generate server-side rendered profile of users
    const htmlArray = await Promise.all(
        userIds.map((userId) => renderToHtml(
            <ProfileWidget userId={userId} />,
            {
                onData: (data) => {
                    // Keep the smallest non-zero maxAge
                    if (data.maxAge && data.maxAge < maxAge) {
                        maxAge = data.maxAge;
                    }
                },
            }
        ))
    );

    return {
        maxAge,
        html: `<body>${htmlArray.join('')}</body>`,
    };
}
```

When `renderToHtml` is called, it will call each widget's `getData` function,
passing in an RxJS `Observable` that emits the widget's props (in this case,
`userId`) every time it's rendered. When the stream returned by `getData`
produces its first event (an object consisting of `state` to inject into the
React component and `hydration` to attach to the HTML page), the widget's React
component will be rendered with the `state` as its `props` and the `hydration`
data will be rendered adjacent to it in the HTML page. The `data` property of
the event will be passed to the `onData` function specified in `renderToHtml`,
if specified at all. It is up to the `onData` function to accumulate `data`
objects as it sees fit, bearing in mind that `onData` is called in render
order, which is defined by `ReactDOM.renderToString`.

Somewhere on the client:

```js
import {hydrate} from 'universal-react-rxjs';
import ProfileWidget from './profile-widget';

// Hydrate all instances of profile-widget on the page
hydrate(ProfileWidget);
```

When `hydrate` is called, it finds all the server-side rendered instances of
the widget in the DOM, reads their attached `props` and `hydration` data, then
calls `getData(props$, hydration, immediate)`, expecting the client to render
the profiles synchronously, without having to load data from APIs.

Bear in mind that widgets are just React components, so you can use them
directly in JSX and you don't even need to initially render them on the server.
You could even use this library just for connecting to RxJS.

## Contextless form

In some situations, context is overkill, because your UI is fairly shallow and
there is not much benefit, if any, to be gained by using a context. And in some
cases, you may be using a component from a third-party library as the
`copmonent` parameter. For this reason, `context` is optional. If you don't
provide a `context`, the `state` of the stream returned by `getData` will be
fed directly into the component's props (which otherwise doesn't receive props
from `widget`).

```jsx harmony
import React from 'react';

export default function Profile({isLoading, name, photo}) {
    return (
        <section className="profile">
            <section className="profile__name">
                {isLoading ? (
                    <em>
                        Loading...
                    </em>
                ) : (
                    name
                )}
            </section>
            <section className="profile__photo">
                <img
                    className="profile__photo-img"
                    src={isLoading ? '/static/img/profile-loading.gif' : photo}
                    alt={isLoading ? 'Loading profile' : 'Profile photo'}
                />
            </section>
        </section>
    );
}
```

```jsx harmony
export default widget({
    name: 'profile',
    component: Profile,
    getData: (props$, hydration, immediate) => {
        // Use your imagination...
    },
    // context omitted
});
```

This saves you from the following additional boilerplate:

```jsx harmony
// NOTE: Don't do this!

const context = React.createContext(null);

function component() {
    return (
        <Inject context={context}>
            {(state) => (
                <Profile {...state} />
            )}
        </Inject>
    );
}

export default widget({
    name: 'profile',
    context,
    component,
    getData,
});
```

## Hooks

A custom hook is provided as an alternative to `<Inject />`.

```jsx harmony
// profile.js

import React from 'react';
import {useWidgetState} from 'universal-react-rxjs';
import profileContext from './profile-context';

export default function Profile() {
    const {isLoading, name, photo} = useWidgetState(
        profileContext,                // same as Inject's context prop
        ['isLoading', 'name', 'photo'] // same as Inject's compare prop
    );

    return (
        <section className="profile">
            <section className="profile__name">
                {isLoading ? (
                    <em>
                        Loading...
                    </em>
                ) : (
                    name
                )}
            </section>
            <section className="profile__photo">
                <img
                    className="profile__photo-img"
                    src={isLoading ? '/static/img/profile-loading.gif' : photo}
                    alt={isLoading ? 'Loading profile' : 'Profile photo'}
                />
            </section>
        </section>
    );
}
```

## Refs

Refs work as expected. Any `ref` passed to a widget will be forwarded to the
underlying component.

```jsx harmony
function SomeComponent({userId}) {
    const profileRef = useRef(null);

    return (
        <ProfileWidget
            ref={profileRef} // ref forwarded to Profile
            userId={userId}
        />        
    );
}
```

The underlying component must be capable of taking a `ref`. Note: `Inject` is
incapable of forwarding `ref`s.

## Support for styled-components

The server-side rendering portion of the above example can be updated as
follows:

```jsx harmony
import React from 'react';
import {renderToHtml, StyledComponentsServerRenderer} from 'universal-react-rxjs';
import ProfileWidget from './profile-widget';

// Server-side render an HTML page consisting of the profiles from a list of
// user IDs.
async function renderUserProfilesPage(userIds) {
    // Generate server-side rendered profile of users
    const renderer = new StyledComponentsServerRenderer();
    const htmlArray = await Promise.all(
        userIds.map((userId) => renderToHtml(
            <ProfileWidget userId={userId} />,
            {renderer}
        ))
    );

    return `<head>${
        renderer.getStyleTags()
    }</head><body>${
        htmlArray.join('')
    }</body>`;
}
```

This uses `StyledComponentsServerRenderer` as an alternative renderer, which
uses `ServerStyleSheet` from styled-components to gather rendered stylesheets.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) in this repo
for contribution guidelines.
