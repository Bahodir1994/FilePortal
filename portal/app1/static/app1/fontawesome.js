  
/*!
 * FontAwesome.js - v0.1.1 - 2016-12-14
 * https://github.com/LotarProject/FontAwesome.js
 * Copyright (c) 2016 Giuseppe Di Terlizzi; Licensed MIT
 */
(function(window){

var FontAwesome = (function(){

var STYLES          = {},
    CURRENT_OPTIONS = {},
    DEFAULT_OPTIONS = {
      size       : null,
      fixedWidth : false,
      border     : false,
      pullLeft   : false,
      pullRight  : false,
      spin       : false,
      pulse      : false,
      rotate     : -1,
      flip       : null,
      inverse    : false,
      url        : 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
      classes    : null,
      tag        : 'i',
    };

function applyDefaultOptions(options) {

  for (var i in DEFAULT_OPTIONS) {
    options[i] = options[i] || DEFAULT_OPTIONS[i];
  }

  return options;

}


function createIcon() {

  var tag     = FontAwesome.options.tag;
  var element = document.createElement(tag);

  for (var i in STYLES) {
    element.style[i] = STYLES[i];
  }

  STYLES = {};

  element.setAttribute('class', iconClasses().join(' '));

  if ('id' in CURRENT_OPTIONS) {
    element.setAttribute('id', CURRENT_OPTIONS.id);
  }

  FontAwesome.element = element;

  return element;

}


function iconClasses() {

  var fa_classes = ['fa', 'fa-' + FontAwesome.name];

  for (option in CURRENT_OPTIONS) {

    var value = CURRENT_OPTIONS[option];

    if (! value) continue;

    switch (option) {

      case 'size':
        if (['lg', '2x', '3x', '4x', '5x'].indexOf(value) < 0) break;
        fa_classes.push('fa-' + value);
        break;

      case 'fixedWidth':
        fa_classes.push('fa-fw');
        break;

      case 'border':
        fa_classes.push('fa-border');
        break;

      case 'pullLeft':
        fa_classes.push('fa-pull-left');
        break;

      case 'pullRight':
        fa_classes.push('fa-pull-right');
        break;

      case 'spin':
        fa_classes.push('fa-spin');
        break;

      case 'pulse':
        fa_classes.push('fa-pulse');
        break;

      case 'rotate':
        if ([90, 180, 270].indexOf(value) < 0) break;
        fa_classes.push('fa-rotate-' + value);
        break;

      case 'flip':
        if (['horizontal', 'vertical'].indexOf(value) < 0) break;
        fa_classes.push('fa-flip-' + value);
        break;

      case 'inverse':
        fa_classes.push('fa-inverse');
        break;

      case 'classes':
        fa_classes.push(value);
        break;

    }

  }

  return fa_classes;

}


function icon(name, options) {

  if (typeof icon === 'undefined') {
    return new Error('required argument');
  }

  this.name = name;
  CURRENT_OPTIONS = applyDefaultOptions(options || {});

  createIcon();

  return this;
}


function load(url) {

  url = url || FontAwesome.options.url;

  var stylesheet = document.createElement('link');
  stylesheet.setAttribute('rel', 'stylesheet');
  stylesheet.setAttribute('href', FontAwesome.options.url);

  document.head.appendChild(stylesheet);

}


function appendTo(selector) {

  var elements = document.querySelectorAll(selector);

  for (var i=0; i < elements.length; i++) {
    elements[i].appendChild(this.element);
  }

}


function prependTo(selector) {

  var elements = document.querySelectorAll(selector);

  for (var i=0; i < elements.length; i++) {
    elements[i].insertBefore(this.element, elements[i].firstChild);
  }

}


function stack (name, options, reverse) {

  if (typeof options === 'boolean') {
    reverse = options;
    options = {};
  }

  options = options || {};
  options.classes = 'fa-stack-2x';

  var normal_icon   = this.element,
      stack_icon    = FontAwesome.icon(name, options).element,
      stack_element = document.createElement('span'),
      stack_size    = ((option.size) ? ['fa-', options.size].join(' ') : '');

  normal_icon.setAttribute('class', [normal_icon.getAttribute('class'), 'fa-stack-1x'].join(' '));

  stack_element.setAttribute('class', ['fa-stack', stack_size].join(' '));
  stack_element.appendChild((reverse ? stack_icon : normal_icon));
  stack_element.appendChild((reverse ? normal_icon : stack_icon));

  this.element = stack_element;

  return this;

}


function css(styles) {

  STYLES = styles;
  createIcon();

  return this;

}


return {
  version  : '0.1.0',
  element  : null,
  options  : DEFAULT_OPTIONS,
  styles   : {},
  icon     : icon,
  name     : null,
  css      : css,
  load     : load,
  appendTo : appendTo,
  prependTo: prependTo,
  stack    : stack,
}

})();

window.FontAwesome = FontAwesome;
window.fa = function(name, options) { return FontAwesome.icon(name, options); }

})(window);