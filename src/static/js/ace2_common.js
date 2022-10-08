'use strict';

/**
 * This code is mostly from the old Etherpad. Please help us to comment this code.
 * This helps other people to understand this code better and helps them to improve it.
 * TL;DR COMMENTS ON THIS FILE ARE HIGHLY APPRECIATED
 */

/**
 * Copyright 2009 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const isNodeText = (node) => (node.nodeType === 3);

const getAssoc = (obj, name) => obj[`_magicdom_${name}`];

const setAssoc = (obj, name, value) => {
  // note that in IE designMode, properties of a node can get
  // copied to new nodes that are spawned during editing; also,
  // properties representable in HTML text can survive copy-and-paste
  obj[`_magicdom_${name}`] = value;
};

// "func" is a function over 0..(numItems-1) that is monotonically
// "increasing" with index (false, then true).  Finds the boundary
// between false and true, a number between 0 and numItems inclusive.


const binarySearch = (numItems, func) => {
  if (numItems < 1) return 0;
  if (func(0)) return 0;
  if (!func(numItems - 1)) return numItems;
  let low = 0; // func(low) is always false
  let high = numItems - 1; // func(high) is always true
  while ((high - low) > 1) {
    const x = Math.floor((low + high) / 2); // x != low, x != high
    if (func(x)) high = x;
    else low = x;
  }
  return high;
};

const binarySearchInfinite = (expectedLength, func) => {
  let i = 0;
  while (!func(i)) i += expectedLength;
  return binarySearch(i, func);
};

const ProxyDocument = (node) => {
  return new Proxy({}, {
    get(obj,key) {
      if(key == "documentElement") {
        return node;
      }
      if(key == "body") {
        return node.firstChild;
      }
      if(node[key] && node[key] instanceof Function) {
        console.log("call node  " +  key)
        return Reflect.get(node,key).bind(node);
      }
      if (node[key]) {
        console.log(node)
        console.log("call node  2 " +  key)
        console.log(Reflect.get(node,key))
        return Reflect.get(node,key);
      }
      if(document[key] && document[key] instanceof Function) {
        console.log("call document 1 " +  key)
        return Reflect.get(document,key).bind(document);
      }
      console.log("call document 2 " +  key)
      console.log(Reflect.get(document,key))
      return Reflect.get(document,key);
    },
    set(obj,key,value) {
      console.log("call document set " + key + " = value " + value);
      obj[key] = value;
      return true;
    }
  })
};
const ProxyIFrameWindow = (win, node) => {
  return new Proxy({},{
    get(obj,key) {
      if(key == "document") {
        return ProxyDocument(node.firstChild);
      }
      if (key == "require") {
        return win.require;
      }

      if(obj[key]) {
        if(obj[key] instanceof Function) {
          console.log("call obj " +  key)
          return Reflect.get(obj,key).bind(obj)
        }
        console.log("call obj 2 " +  key)
        return obj[key]
      }

      if(node[key]) {
        if(node[key] instanceof Function) {
          console.log("call iframenode " +  key)
          return Reflect.get(node,key).bind(node)
        }
        console.log("call iframenode 2 " +  key)
        return node[key]
      }
      if (win[key] && win[key] instanceof Function) {
        console.log("call window " +  key)
        return Reflect.get(win,key).bind(win);
      }
      console.log("call window 2 " +  key)
      return Reflect.get(win,key);
    },
    set(obj,key,value) {
      console.log("call set " + key + " = value " + value);
      win[key] = value;
      obj[key] = value;
      return true;
    }
  })
};
const createIFrame = () => {
  const iframeNode = document.createElement("div");

  Object.defineProperty(iframeNode, 'name', {
    get() { return iframeNode.getAttribute('name'); },
    set(newValue) { iframeNode.setAttribute('name', newValue); },
    enumerable: true,
    configurable: true,
  });

  iframeNode.setAttribute("cname","iframe");
  const htmlNode = document.createElement("div");
  htmlNode.setAttribute("cname","html");

  const bodyNode = document.createElement("div");
  bodyNode.setAttribute("cname","body");
  htmlNode.appendChild(bodyNode);
  iframeNode.appendChild(htmlNode);
  iframeNode.documentElement = htmlNode;
  htmlNode.body = bodyNode;
  iframeNode.contentWindow = ProxyIFrameWindow(window,iframeNode);


  return iframeNode;
}

const getIFrameByName = (name) => {
  const iframeNode = document.getElementsByName(name)[0];

  Object.defineProperty(iframeNode, 'name', {
    get() { return iframeNode.getAttribute('name'); },
    set(newValue) { iframeNode.setAttribute('name', newValue); },
    enumerable: true,
    configurable: true,
  });


  const htmlNode = iframeNode.firstChild;


  const bodyNode = htmlNode.firstChild;


  iframeNode.documentElement = htmlNode;
  htmlNode.body = bodyNode;
  iframeNode.contentWindow = ProxyIFrameWindow(window, iframeNode);


  return iframeNode;
}


const noop = () => {};

exports.createIFrame = createIFrame;

exports.getIFrameByName = getIFrameByName;
exports.isNodeText = isNodeText;
exports.getAssoc = getAssoc;
exports.setAssoc = setAssoc;
exports.binarySearch = binarySearch;
exports.binarySearchInfinite = binarySearchInfinite;
exports.noop = noop;
