/* Copyright (c) 2021 Read Write Tools. Legal use subject to the Dockable Panels DOM Component Software License Agreement. */
const Static = {
    componentName: 'rwt-dockable-panels',
    elementInstance: 1,
    componentPath: '/',
    htmlURL: 'rwt-dockable-panels.html',
    cssURL: 'rwt-dockable-panels.css',
    htmlText: null,
    cssText: null,
    nextId: 1,
    nextTabIndex: 100,
    TOPMOST_OPEN: '☰',
    TOPMOST_CLOSED: '☰',
    EXPAND: '+',
    COLLAPSE: 'x',
    FLOAT_RIGHT: '>',
    FLOAT_LEFT: '<',
    COLLAPSE_RIGHT: '<',
    COLLAPSE_LEFT: '>'
};

Object.seal(Static);

export default class RwtDockablePanels extends HTMLElement {
    constructor() {
        super(), this.instance = Static.elementInstance++, this.isComponentLoaded = !1, 
        this.collapseSender = `${Static.componentName} ${this.instance}`, this.shortcutKey = null, 
        this.corner = null, this.nextZIndex = 2, this.nextFloatLeft = 0, this.toolbar = null, 
        this.toolbarNav = null, this.toolbarTitlebar = null, this.toolbarExpandButton = null, 
        this.toolbarHolder = null, Object.seal(this);
    }
    async connectedCallback() {
        if (this.isConnected) try {
            this.determineComponentPath();
            var e = await this.getHtmlFragment(), t = await this.getCssStyleElement();
            this.attachShadow({
                mode: 'open'
            }), this.shadowRoot.appendChild(e), this.shadowRoot.appendChild(t), this.style.touchAction = 'none', 
            this.style.userSelect = 'none', this.identifyChildren(), this.initializeShortcutKey(), 
            this.determineCorner(), await this.getConfiguredPanels(), this.determineInitialState(), 
            this.registerEventListeners(), this.sendComponentLoaded(), this.validate();
        } catch (e) {
            console.log(e.message);
        }
    }
    determineComponentPath() {
        Static.componentPath = new URL(import.meta.url).pathname;
        var e = Static.componentPath.lastIndexOf('/');
        -1 != e && (Static.componentPath = Static.componentPath.substr(0, e + 1));
    }
    getHtmlFragment() {
        return new Promise((async (e, t) => {
            var o = `${Static.componentName}-html-template-ready`;
            if (document.addEventListener(o, (() => {
                var t = document.createElement('template');
                t.innerHTML = Static.htmlText, e(t.content);
            })), 1 == this.instance) {
                var n = `${Static.componentPath}${Static.htmlURL}`, a = await fetch(n, {
                    cache: 'no-cache',
                    referrerPolicy: 'no-referrer'
                });
                if (200 != a.status && 304 != a.status) return void t(new Error(`Request for ${n} returned with ${a.status}`));
                Static.htmlText = await a.text(), document.dispatchEvent(new Event(o));
            } else null != Static.htmlText && document.dispatchEvent(new Event(o));
        }));
    }
    getCssStyleElement() {
        return new Promise((async (e, t) => {
            var o = `${Static.componentName}-css-text-ready`;
            if (document.addEventListener(o, (() => {
                var t = document.createElement('style');
                t.innerHTML = Static.cssText, e(t);
            })), 1 == this.instance) {
                var n = `${Static.componentPath}${Static.cssURL}`, a = await fetch(n, {
                    cache: 'no-cache',
                    referrerPolicy: 'no-referrer'
                });
                if (200 != a.status && 304 != a.status) return void t(new Error(`Request for ${n} returned with ${a.status}`));
                Static.cssText = await a.text(), document.dispatchEvent(new Event(o));
            } else null != Static.cssText && document.dispatchEvent(new Event(o));
        }));
    }
    identifyChildren() {
        this.toolbar = this.shadowRoot.getElementById('toolbar'), this.toolbar.isTopmostMenu = !0, 
        this.toolbar.isExpanded = !0, this.toolbarNav = this.shadowRoot.getElementById('toolbar-nav'), 
        this.toolbarTitlebar = this.shadowRoot.getElementById('toolbar-titlebar'), this.toolbarExpandButton = this.shadowRoot.getElementById('toolbar-expand-button'), 
        this.toolbarHolder = this.shadowRoot.getElementById('toolbar-holder');
    }
    initializeShortcutKey() {
        this.hasAttribute('shortcut') && (this.shortcutKey = this.getAttribute('shortcut'));
    }
    determineCorner() {
        var e = this.getAttribute('corner');
        switch (e) {
          case 'bottom-left':
          case 'bottom-right':
          case 'top-left':
          case 'top-right':
            this.setCorner(e);
            break;

          default:
            this.setCorner('bottom-left');
        }
    }
    setCorner(e) {
        -1 != e.indexOf('bottom') && -1 != e.indexOf('left') ? this.corner = 'bottom-left' : -1 != e.indexOf('bottom') && -1 != e.indexOf('right') ? this.corner = 'bottom-right' : -1 != e.indexOf('top') && -1 != e.indexOf('left') ? this.corner = 'top-left' : -1 != e.indexOf('top') && -1 != e.indexOf('right') && (this.corner = 'top-right'), 
        this.toolbar.className = `${this.corner} chef-toolbar`;
    }
    async getConfiguredPanels() {
        if (0 != this.hasAttribute('sourceref')) {
            var e = this.getAttribute('sourceref');
            try {
                var t = await fetch(e, {
                    cache: 'no-cache',
                    referrerPolicy: 'no-referrer'
                });
                if (200 != t.status && 304 != t.status) return null;
                var o = await t.json();
                if (o.toolbar && o.toolbar.titlebar && this.setTitlebar(o.toolbar.titlebar), o.panels) for (let e = 0; e < o.panels.length; e++) {
                    var n = o.panels[e].options, a = o.panels[e].panelLines;
                    n && a && this.appendPanel(n.id, n, a);
                }
            } catch (e) {
                console.log(e.message);
            }
        }
    }
    determineInitialState() {
        this.hasAttribute('state') && 'closed' == this.getAttribute('state') ? this.closeToolbar() : this.openToolbar();
    }
    registerEventListeners() {
        this.shadowRoot.getElementById('toolbar-titlebar').addEventListener('pointerdown', this.onPointerdownToolbar.bind(this)), 
        this.shadowRoot.getElementById('toolbar-expand-button').addEventListener('click', this.onClickExpandButton.bind(this)), 
        document.addEventListener('keydown', this.onKeydownDocument.bind(this)), document.addEventListener('collapse-popup', this.onCollapsePopup.bind(this));
    }
    sendComponentLoaded() {
        this.isComponentLoaded = !0, this.dispatchEvent(new Event('component-loaded', {
            bubbles: !0
        }));
    }
    waitOnLoading() {
        return new Promise((e => {
            1 == this.isComponentLoaded ? e() : this.addEventListener('component-loaded', e);
        }));
    }
    setTitlebar(e) {
        this.shadowRoot.getElementById('toolbar-titlebar').innerHTML = e;
    }
    hasPanel(e) {
        return null != this.shadowRoot.getElementById(e);
    }
    appendPanel(e, t, o) {
        t.titlebar = t.titlebar ?? '', t.expandable = t.expandable ?? !0, t.dockable = t.dockable ?? !0, 
        t.tooltip = t.tooltip ?? '', null == t.tabIndex && (t.tabIndex = Static.nextTabIndex, 
        Static.nextTabIndex += 100);
        var n = document.createElement('menu');
        n.id = e, n.className = 'chef-panel', n.isTopmostMenu = !1, n.isExpanded = !1, n.isDocked = !0, 
        n.tabIndex = t.tabIndex, this.toolbarHolder.appendChild(n);
        var a = document.createElement('nav');
        (a.id = `${e}-nav`, a.className = 'chef-nav', n.appendChild(a), t.expandable) && ((i = this.createTitlebarButton(a, `${e}-expand-button`, 'chef-expand-button', Static.EXPAND, 'Show more', t.tabIndex + 2)).isExpanded = !1, 
        i.addEventListener('click', this.onClickExpandButton.bind(this)));
        if (t.dockable) {
            var i, s = 'top-left' == this.corner || 'bottom-left' == this.corner ? Static.FLOAT_RIGHT : Static.FLOAT_LEFT;
            (i = this.createTitlebarButton(a, `${e}-float-button`, 'chef-float-button', s, 'Detach menu', t.tabIndex + 1)).isDocked = !0, 
            i.addEventListener('click', this.onClickFloatButton.bind(this));
        }
        var r = this.createTitlebarButton(a, `${e}-titlebar`, 'chef-h2', t.titlebar, t.tooltip, t.tabIndex + 0);
        r.isTopmostMenu = !1, 0 != t.expandable && 0 != t.dockable || (r.style.width = 'var(--width-h1)'), 
        0 == t.expandable && 0 == t.dockable && (r.style.width = 'var(--width)');
        var l = document.createElement('div');
        l.className = 'chef-content', n.appendChild(l);
        for (let e = 0; e < o.length; e++) {
            var d = o[e], c = d.lineType;
            switch (c) {
              case 'input':
                this.appendInputLine(l, d);
                break;

              case 'button':
                this.appendSingleButton(l, d);
                break;

              case 'multi-button':
                this.appendMultiButtons(l, d);
                break;

              case 'dropdown':
                this.appendDropdown(l, d);
                break;

              case 'slider+input':
                this.appendSliderWithInput(l, d);
                break;

              case 'generic':
                this.appendGenericArea(l, d);
                break;

              case 'custom':
                this.appendCustomArea(l, d);
                break;

              case 'table':
                this.appendTableArea(l, d);
                break;

              default:
                console.log(`appendPanel line ${e} specifies an unrecognized lineType "${c}"`);
            }
        }
        return n;
    }
    appendInputLine(e, t) {
        console.assert('input' == t.lineType), t.id = t.id || 'id' + Static.nextId++, t.labelText = t.labelText || '', 
        t.cssText = t.cssText || '';
        var o = this.createLineWrapper(e);
        t.cssText && (o.style.cssText = t.cssText);
        var n = document.createElement('label');
        n.id = `${t.id}-label`, n.htmlFor = t.id, n.className = 'chef-label', n.appendChild(document.createTextNode(t.labelText)), 
        o.appendChild(n);
        var a = document.createElement('input');
        if (a.type = 'text', a.id = t.id, a.className = 'chef-input', null != t.tooltip && (a.title = t.tooltip), 
        null != t.widthInPx && (a.style.width = t.widthInPx), o.appendChild(a), null != t.textAfter) {
            var i = document.createElement('span');
            i.id = `${t.id}-after`, i.className = 'chef-after', i.appendChild(document.createTextNode(t.textAfter)), 
            o.appendChild(i);
        }
        return a;
    }
    appendSliderWithInput(e, t) {
        console.assert('slider+input' == t.lineType), t.id = t.id || 'id' + Static.nextId++, 
        t.labelText = t.labelText || '', t.textAfter = t.textAfter || '', t.cssText = t.cssText || '';
        var o = null == t.tooltip ? '' : `title="${t.tooltip}"`, n = null == t.widthInPx ? '' : `style='width: ${t.widthInPx}'`, a = t.numDecimals || 2, i = parseFloat(t.minPosition);
        isNaN(i) && (i = 0);
        var s = parseFloat(t.maxPosition);
        isNaN(s) && (s = 100);
        var r = parseFloat(t.stepPosition);
        isNaN(r) && (r = 1);
        var l = null != t.minValue ? parseFloat(t.minValue) : '', d = null != t.minValue ? parseFloat(t.maxValue) : '', c = t.curve || 'linear', h = null;
        h = null != t.toSlider && 'Function' == t.toSlider.constructor.name ? t.toSlider : 'log' == c ? this.toSliderLogarithmic.bind(null, i, s, l, d) : this.toSliderLinear;
        var p = null;
        p = null != t.fromSlider && 'Function' == t.fromSlider.constructor.name ? t.fromSlider : 'log' == c ? this.fromSliderLogarithmic.bind(null, i, s, l, d) : this.fromSliderLinear;
        var u = null;
        u = null != t.toUser && 'Function' == t.toUser.constructor.name ? t.toUser : this.toUserFixedDecimal.bind(null, a, l, d);
        var m = null;
        m = null != t.fromUser && 'Function' == t.fromUser.constructor.name ? t.fromUser : this.fromUserFixedDecimal.bind(null, a, l, d);
        var f = this.createLineWrapper(e);
        t.cssText && (f.style.cssText = t.cssText), f.innerHTML = `\n\t\t\t<label id='${t.id}-label' class='chef-label'>${t.labelText}</label>\n\t\t\t<input id='${t.id}'       class='chef-input' type='text' ${o} ${n}></input>\n\t\t\t<span  id='${t.id}-after' class='chef-after'>${t.textAfter}</span>`, 
        this.createLineWrapper(e).innerHTML = `<input id='${t.id}-slider' class='chef-slider' type='range' ${o} min='${i}' max='${s}' step='${r}'></input>`;
        var b = this.shadowRoot.getElementById(`${t.id}`), x = this.shadowRoot.getElementById(`${t.id}-slider`);
        b.addEventListener('change', (e => {
            var t = b.value, o = m(t), n = h(o);
            t = u(o);
            b.value = t, x.value = n;
        })), x.addEventListener('input', (e => {
            var t = parseFloat(x.value), o = p(t), n = u(o);
            b.value = n;
        }));
    }
    fromSliderLinear(e) {
        return e;
    }
    fromSliderLogarithmic(e, t, o, n, a) {
        o = Math.log(o);
        var i = ((n = Math.log(n)) - o) / (t - e);
        return Math.exp(o + i * (a - e));
    }
    toSliderLinear(e) {
        return e;
    }
    toSliderLogarithmic(e, t, o, n, a) {
        o = Math.log(o);
        var i = ((n = Math.log(n)) - o) / (t - e);
        return (Math.log(a) - o) / i + e;
    }
    toUserFixedDecimal(e, t, o, n) {
        return parseFloat(n).toFixed(e);
    }
    fromUserFixedDecimal(e, t, o, n) {
        var a = 0 == e ? parseInt(n) : parseFloat(n);
        if ('' != t && '' != o) isNaN(a) && (a = t), a < t && (a = t), a > o && (a = o); else if (isNaN(a)) return;
        if (e > 0) {
            var i = a.toFixed(e);
            a = parseFloat(i);
        }
        return a;
    }
    appendSingleButton(e, t) {
        console.assert('button' == t.lineType), t.id = t.id || 'id' + Static.nextId++, t.buttonText = t.buttonText || 'OK', 
        t.cssText = t.cssText || '';
        var o = this.createLineWrapper(e);
        t.cssText && (o.style.cssText = t.cssText);
        var n = document.createElement('button');
        return n.type = 'button', n.id = t.id, n.className = 'chef-command', null != t.tooltip && (n.title = t.tooltip), 
        n.appendChild(document.createTextNode(t.buttonText)), o.appendChild(n), n;
    }
    appendMultiButtons(e, t) {
        console.assert('multi-button' == t.lineType), console.assert(null != t.buttons), 
        t.cssText = t.cssText || '';
        var o = this.createLineWrapper(e);
        t.cssText && (o.style.cssText = t.cssText);
        for (var n = [], a = 0; a < t.buttons.length; a++) {
            var i = t.buttons[a];
            i.id = i.id || 'id' + Static.nextId++, i.buttonText = i.buttonText || 'OK';
            var s = document.createElement('button');
            s.type = 'button', s.id = i.id, s.className = 'chef-command chef-one-third-command', 
            null != i.tooltip && (s.title = i.tooltip), s.appendChild(document.createTextNode(i.buttonText)), 
            o.appendChild(s), n.push(s);
        }
        return n;
    }
    appendDropdown(e, t) {
        console.assert('dropdown' == t.lineType), t.id = t.id || 'id' + Static.nextId++, 
        t.labelText = t.labelText || '', t.cssText = t.cssText || '';
        var o = this.createLineWrapper(e);
        t.cssText && (o.style.cssText = t.cssText);
        var n = document.createElement('label');
        n.htmlFor = t.id, n.className = 'chef-label', n.appendChild(document.createTextNode(t.labelText)), 
        o.appendChild(n);
        var a = document.createElement('select');
        a.id = t.id, a.className = 'chef-select', null != t.tooltip && (a.title = t.tooltip), 
        o.appendChild(a);
        for (var i = 0; i < t.selections.length; i++) {
            var s = document.createElement('option');
            s.value = t.selections[i].v, s.appendChild(document.createTextNode(t.selections[i].t)), 
            a.appendChild(s);
        }
        return a;
    }
    appendGenericArea(e, t) {
        console.assert('generic' == t.lineType), t.id = t.id || 'id' + Static.nextId++, 
        t.innerHTML = t.innerHTML || '', t.heightInPx = t.heightInPx || 'fit-content', t.overflowX = t.overflowX || 'hidden', 
        t.overflowY = t.overflowY || 'hidden', t.cssText = t.cssText || '';
        var o = this.createLineWrapper(e);
        t.cssText && (o.style.cssText = t.cssText), o.style.overflowX = t.overflowX, o.style.overflowY = t.overflowY, 
        o.style.padding = '0', o.style.height = t.heightInPx;
        var n = document.createElement('div');
        return n.id = t.id, n.className = 'chef-generic', n.innerHTML = t.innerHTML, o.appendChild(n), 
        n;
    }
    appendCustomArea(e, t) {
        console.assert('custom' == t.lineType), t.id = t.id || 'id' + Static.nextId++, t.innerHTML = t.innerHTML || '<div></div>', 
        t.heightInPx = t.heightInPx || 'fit-content', t.overflowX = t.overflowX || 'hidden', 
        t.overflowY = t.overflowY || 'hidden', t.cssText = t.cssText || '';
        var o = this.createLineWrapper(e);
        t.cssText && (o.style.cssText = t.cssText), o.style.overflowX = t.overflowX, o.style.overflowY = t.overflowY, 
        o.style.padding = '0', o.style.height = t.heightInPx;
        var n = document.createElement('div');
        return n.id = t.id, n.className = 'chef-custom', n.innerHTML = t.innerHTML, o.appendChild(n), 
        n;
    }
    appendTableArea(e, t) {
        console.assert('table' == t.lineType), t.id = t.id || 'id' + Static.nextId++, t.innerHTML = t.innerHTML || '', 
        t.overflowX = t.overflowX || 'auto', t.overflowY = t.overflowY || 'auto', t.cssText = t.cssText || '';
        var o = this.createLineWrapper(e);
        t.cssText && (o.style.cssText = t.cssText), o.style.padding = '0', t.minHeightInPx && (o.style.minHeight = t.minHeightInPx), 
        t.maxHeightInPx && (o.style.maxHeight = t.maxHeightInPx), t.heightInPx ? o.style.height = t.heightInPx : o.style.height = '100%', 
        o.style.overflowX = t.overflowX, o.style.overflowY = t.overflowY;
        var n = document.createElement('table');
        return n.id = t.id, n.className = 'chef-table', n.style.width = '100%', n.innerHTML = t.innerHTML, 
        o.appendChild(n), n;
    }
    createTitlebarButton(e, t, o, n, a, i) {
        var s = document.createElement('button');
        return s.type = 'button', s.id = t, s.className = o, s.tabIndex = i, s.title = a, 
        s.appendChild(document.createTextNode(n)), e.appendChild(s), s;
    }
    createLineWrapper(e) {
        var t = document.createElement('div');
        return t.className = 'chef-section', e.appendChild(t), t;
    }
    getMenuElement(e) {
        return this.shadowRoot.getElementById(e);
    }
    getExpandButton(e) {
        return this.shadowRoot.getElementById(e + '-expand-button');
    }
    getFloatButton(e) {
        return this.shadowRoot.getElementById(e + '-float-button');
    }
    getTitlebar(e) {
        return this.shadowRoot.getElementById(e + '-titlebar');
    }
    openToolbar() {
        this.expandCollapseHelper(this.toolbar, this.toolbarExpandButton, 'expand');
    }
    closeToolbar() {
        this.expandCollapseHelper(this.toolbar, this.toolbarExpandButton, 'collapse');
    }
    toggleToolbar() {
        this.toolbar.isExpanded ? this.closeToolbar() : this.openToolbar();
    }
    expandPanel(e) {
        var t = this.getMenuElement(e), o = this.getExpandButton(e);
        t && o && this.expandCollapseHelper(t, o, 'expand');
    }
    collapsePanel(e) {
        var t = this.getMenuElement(e), o = this.getExpandButton(e);
        t && o && this.expandCollapseHelper(t, o, 'collapse');
    }
    onClickExpandButton(e) {
        var t = e.target;
        if ('BUTTON' == t.tagName) {
            var o = t.parentNode;
            if ('NAV' == o.tagName) {
                var n = o.parentNode;
                if ('MENU' == n.tagName) {
                    var a = n.isExpanded ? 'collapse' : 'expand';
                    this.expandCollapseHelper(n, t, a), e.stopPropagation();
                }
            }
        }
    }
    expandCollapseHelper(e, t, o) {
        e.isTopmostMenu ? e.style.display = 'flex' : e.isDocked ? this.toolbar.isExpanded ? e.style.display = 'block' : e.style.display = 'none' : e.style.display = 'block';
        for (var n = 0; n < e.children.length; n++) {
            var a = e.children[n];
            e.isTopmostMenu || 'chef-content' != a.className || (a.style.display = 'expand' == o ? 'block' : 'none');
        }
        if (1 == e.isTopmostMenu) {
            'expand' == o ? (this.toolbarTitlebar.style.display = 'block', e.style.width = 'var(--width)', 
            t.innerHTML = Static.TOPMOST_OPEN, t.title = null == this.shortcutKey ? 'Close' : `Close (${this.shortcutKey})`, 
            this.collapseOtherPopups()) : (this.toolbarTitlebar.style.display = 'none', e.style.width = '24px', 
            t.innerHTML = Static.TOPMOST_CLOSED, t.title = null == this.shortcutKey ? 'Open' : `Open (${this.shortcutKey})`);
            for (n = 0; n < this.toolbarHolder.children.length; n++) {
                'chef-content' == (a = this.toolbarHolder.children[n]).className ? a.style.display = 'expand' == o ? 'flex' : 'none' : a.style.display = 'expand' == o ? 'block' : 'none';
            }
        } else 'expand' == o ? (t.innerHTML = Static.COLLAPSE, t.title = 'Show less') : (t.innerHTML = Static.EXPAND, 
        t.title = 'Show more');
        e.isExpanded = 'expand' == o;
    }
    detachPanel(e) {
        var t = this.getMenuElement(e), o = this.getFloatButton(e);
        t && o && this.floatDockHelper(t, o, 'float');
    }
    attachPanel(e) {
        var t = this.getMenuElement(e), o = this.getFloatButton(e);
        t && o && this.floatDockHelper(t, o, 'dock');
    }
    presetDetachedX(e, t) {
        var o = this.getMenuElement(e);
        null != o && 'MENU' == o.tagName && (o.savePosition = o.savePosition || {}, 'top-left' == this.corner || 'bottom-left' == this.corner ? o.savePosition.left = t : o.savePosition.right = t);
    }
    presetDetachedY(e, t) {
        var o = this.getMenuElement(e);
        null != o && 'MENU' == o.tagName && (o.savePosition = o.savePosition || {}, 'top-left' == this.corner || 'top-right' == this.corner ? o.savePosition.top = t : o.savePosition.bottom = t);
    }
    presetDetachedWidth(e, t) {
        var o = this.getMenuElement(e);
        null != o && 'MENU' == o.tagName && (o.savePosition = o.savePosition || {}, o.savePosition.width = t);
    }
    presetDetachedHeight(e, t) {
        var o = this.getMenuElement(e);
        null != o && 'MENU' == o.tagName && (o.savePosition = o.savePosition || {}, o.savePosition.height = t);
    }
    onClickFloatButton(e) {
        var t = e.target;
        if ('BUTTON' == t.tagName) {
            var o = t.parentNode;
            if ('NAV' == o.tagName) {
                var n = o.parentNode;
                if ('MENU' == n.tagName) {
                    var a = n.isDocked ? 'float' : 'dock';
                    this.floatDockHelper(n, t, a), e.stopPropagation();
                }
            }
        }
    }
    nextFloatDeltaX() {
        return this.nextFloatLeft = this.nextFloatLeft > 100 ? 14 : this.nextFloatLeft + 14, 
        this.nextFloatLeft;
    }
    floatDockHelper(e, t, o) {
        if ('float' == o) {
            if (0 == e.isDocked) return;
            var n = document.createElement('div');
            n.style.display = 'none', e.parentNode.insertBefore(n, e), e.saveReferenceNode = n, 
            e.saveParentNode = e.parentNode, (c = document.createElement('menu')).className = 'chef-toolbar chef-floating-toolbar', 
            e.boundPointerdownToolbar = this.onPointerdownToolbar.bind(this), e.addEventListener('pointerdown', e.boundPointerdownToolbar);
            var a = e.savePosition, i = null != a, s = 20, r = this.nextFloatDeltaX();
            if ('top-left' == this.corner || 'bottom-left' == this.corner) if (i) c.style.left = a.left; else {
                var l = this.toolbar.offsetLeft + this.toolbar.offsetWidth + r;
                l = Math.min(l, window.innerWidth - this.toolbar.offsetWidth - s), l = Math.max(l, s), 
                c.style.left = l + 'px';
            } else if (i) c.style.right = a.right; else {
                l = window.innerWidth - this.toolbar.offsetLeft + r;
                l = Math.min(l, window.innerWidth - this.toolbar.offsetWidth - s), l = Math.max(l, s), 
                c.style.right = l + 'px';
            }
            if ('top-left' == this.corner || 'top-right' == this.corner) if (i) c.style.top = a.top; else {
                var d = this.toolbar.offsetTop + r;
                d = Math.min(d, window.innerHeight - e.offsetHeight - s), d = Math.max(d, s), c.style.top = d + 'px';
            } else if (i) c.style.bottom = a.bottom; else {
                d = window.innerHeight - this.toolbar.offsetTop + r;
                this.expandPanel(e.id), d = Math.min(d, window.innerHeight - e.offsetHeight - s), 
                d = Math.max(d, s), c.style.bottom = d + 'px';
            }
            this.shadowRoot.appendChild(c), i && ('' != a.width && (c.style.width = a.width), 
            '' != a.height && (c.style.height = a.height)), c.appendChild(e), t.innerHTML = 'top-left' == this.corner || 'bottom-left' == this.corner ? Static.COLLAPSE_RIGHT : Static.COLLAPSE_LEFT, 
            t.title = 'Dock menu', e.isDocked = !1, this.expandPanel(e.id), e.style.zIndex = this.nextZIndex++, 
            e.focus();
        } else {
            if (1 == e.isDocked) return;
            var c = e.parentNode;
            e.savePosition = {}, e.savePosition.left = c.style.left, e.savePosition.right = c.style.right, 
            e.savePosition.top = c.style.top, e.savePosition.bottom = c.style.bottom, e.savePosition.width = c.style.width, 
            e.savePosition.height = c.style.height, e.saveParentNode.insertBefore(e, e.saveReferenceNode), 
            e.saveParentNode.removeChild(e.saveReferenceNode), c.parentNode.removeChild(c), 
            e.removeEventListener('pointerdown', e.boundPointerdownToolbar), e.saveParentNode.isExpanded || (e.style.display = 'none'), 
            t.innerHTML = 'top-left' == this.corner || 'bottom-left' == this.corner ? Static.FLOAT_RIGHT : Static.FLOAT_LEFT, 
            t.title = 'Detach menu', e.isDocked = !0, this.collapsePanel(e.id);
        }
    }
    collapseOtherPopups() {
        var e = new CustomEvent('collapse-popup', {
            detail: this.collapseSender
        });
        document.dispatchEvent(e);
    }
    onCollapsePopup(e) {
        e.detail != this.collapseSender && this.closeToolbar();
    }
    onKeydownDocument(e) {
        'Escape' == e.key && (this.escapeKeyHandler(), e.stopPropagation()), e.key == this.shortcutKey && null != this.shortcutKey && (this.toggleToolbar(), 
        e.stopPropagation(), e.preventDefault());
    }
    escapeKeyHandler() {
        var e = this.collapseFirstDetachedOpenPanel();
        e || (e = this.dockFirstDetachedPanel()), e || (e = this.collapseFirstAttachedOpenPanel()), 
        e || this.closeToolbar();
    }
    collapseFirstDetachedOpenPanel() {
        var e = this.shadowRoot.querySelectorAll('menu.chef-toolbar ~ menu');
        for (let t = 0; t < e.length; t++) {
            let o = e[t].querySelector('menu.chef-panel');
            if (null != o && 1 == o.isExpanded) return this.collapsePanel(o.id), !0;
        }
        return !1;
    }
    dockFirstDetachedPanel() {
        var e = this.shadowRoot.querySelectorAll('menu.chef-toolbar ~ menu');
        for (let t = 0; t < e.length; t++) {
            let o = e[t].querySelector('menu.chef-panel');
            if (null != o && 0 == o.isExpanded) return this.attachPanel(o.id), !0;
        }
        return !1;
    }
    collapseFirstAttachedOpenPanel() {
        var e = this.toolbar.querySelectorAll('menu');
        for (let t = 0; t < e.length; t++) {
            let o = e[t];
            if (1 == o.isExpanded) return this.collapsePanel(o.id), !0;
        }
        return !1;
    }
    onPointerdownToolbar(e) {
        if ('chef-expand-button' != e.target.className && 'chef-float-button' != e.target.className) {
            for (var t = e.target, o = null; null == o; ) if (-1 != t.className.indexOf('chef-toolbar')) o = t; else {
                if (-1 != t.className.indexOf('chef-section')) return;
                if ('#document-fragment' == t.parentNode.nodeName) return;
                t = t.parentNode;
            }
            'top-left' == this.corner || 'bottom-left' == this.corner ? o.startingElementX = o.offsetLeft : o.startingElementX = this.pxToNum(window.getComputedStyle(o).getPropertyValue('right')), 
            'top-left' == this.corner || 'top-right' == this.corner ? o.startingElementY = o.offsetTop : o.startingElementY = this.pxToNum(window.getComputedStyle(o).getPropertyValue('bottom')), 
            o.startingMouseX = e.pageX, o.startingMouseY = e.pageY, o.boundPointermoveToolbar = this.onPointermoveToolbar.bind(this), 
            o.addEventListener('pointermove', o.boundPointermoveToolbar), o.boundPointerupToolbar = this.onPointerupToolbar.bind(this), 
            o.addEventListener('pointerup', o.boundPointerupToolbar), o.style.zIndex = this.nextZIndex++, 
            o.setPointerCapture(e.pointerId), e.stopPropagation();
        }
    }
    onPointermoveToolbar(e) {
        var t = e.currentTarget;
        if ('top-left' == this.corner) {
            var o = t.startingElementY - (t.startingMouseY - e.pageY), n = t.startingElementX - (t.startingMouseX - e.pageX);
            t.style.top = o + 'px', t.style.left = n + 'px';
        } else if ('bottom-left' == this.corner) {
            o = t.startingElementY + (t.startingMouseY - e.pageY), n = t.startingElementX - (t.startingMouseX - e.pageX);
            t.style.bottom = o + 'px', t.style.left = n + 'px';
        } else if ('top-right' == this.corner) {
            o = t.startingElementY - (t.startingMouseY - e.pageY), n = t.startingElementX + (t.startingMouseX - e.pageX);
            t.style.top = o + 'px', t.style.right = n + 'px';
        } else if ('bottom-right' == this.corner) {
            o = t.startingElementY + (t.startingMouseY - e.pageY), n = t.startingElementX + (t.startingMouseX - e.pageX);
            t.style.bottom = o + 'px', t.style.right = n + 'px';
        } else console.error(`unrecognized corner ${this.corner}`);
        e.stopPropagation();
    }
    onPointerupToolbar(e) {
        var t = e.currentTarget;
        t.releasePointerCapture(e.pointerId), t.removeEventListener('pointermove', t.boundPointermoveToolbar), 
        t.removeEventListener('pointerup', t.boundPointerupToolbar), e.stopPropagation();
    }
    pxToNum(e) {
        var t = e.indexOf('px');
        return -1 != t && (e = e.substr(0, t)), parseInt(e);
    }
    async validate() {
        if (1 == this.instance) {
            var e = (i = window.location.hostname).split('.'), t = 25;
            if (e.length >= 2) {
                var o = e[e.length - 2].charAt(0);
                (o < 'a' || o > 'z') && (o = 'q'), t = o.charCodeAt(o) - 97, t = Math.max(t, 0), 
                t = Math.min(t, 25);
            }
            var n = new Date;
            n.setUTCMonth(0, 1);
            var a = (Math.floor((Date.now() - n) / 864e5) + 1) % 26, i = window.location.hostname, s = `Unregistered ${Static.componentName} component.`;
            try {
                var r = (await import('../../rwt-registration-keys.js')).default;
                for (let e = 0; e < r.length; e++) {
                    var l = r[e];
                    if (l.hasOwnProperty('product-key') && l['product-key'] == Static.componentName) return i != l.registration && console.warn(`${s} See https://readwritetools.com/licensing.blue to learn more.`), 
                    void (a == t && window.setTimeout(this.authenticate.bind(this, l), 1e3));
                }
                console.warn(`${s} rwt-registration-key.js file missing "product-key": "${Static.componentName}"`);
            } catch (e) {
                console.warn(`${s} rwt-registration-key.js missing from website's root directory.`);
            }
        }
    }
    async authenticate(e) {
        var t = encodeURIComponent(window.location.hostname), o = encodeURIComponent(window.location.href), n = encodeURIComponent(e.registration), a = encodeURIComponent(e['customer-number']), i = encodeURIComponent(e['access-key']), s = {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: `product-name=${Static.componentName}&hostname=${t}&href=${o}&registration=${n}&customer-number=${a}&access-key=${i}`
        };
        try {
            var r = await fetch('https://validation.readwritetools.com/v1/genuine/component', s);
            if (200 == r.status) await r.json();
        } catch (e) {
            console.info(e.message);
        }
    }
}

window.customElements.define(Static.componentName, RwtDockablePanels);