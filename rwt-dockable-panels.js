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
        this.collapseSender = `${Static.componentName} ${this.instance}`, this.corner = null, 
        this.nextZIndex = 2, this.nextFloatLeft = 0, this.toolbar = null, this.toolbarNav = null, 
        this.toolbarTitlebar = null, this.toolbarExpandButton = null, Object.seal(this);
    }
    async connectedCallback() {
        if (this.isConnected) try {
            this.determineComponentPath();
            var e = await this.getHtmlFragment(), t = await this.getCssStyleElement();
            this.attachShadow({
                mode: 'open'
            }), this.shadowRoot.appendChild(e), this.shadowRoot.appendChild(t), this.style.touchAction = 'none', 
            this.style.userSelect = 'none', this.identifyChildren(), this.determineCorner(), 
            await this.getConfiguredPanels(), this.determineInitialState(), this.registerEventListeners(), 
            this.sendComponentLoaded(), this.validate();
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
            var n = `${Static.componentName}-html-template-ready`;
            if (document.addEventListener(n, (() => {
                var t = document.createElement('template');
                t.innerHTML = Static.htmlText, e(t.content);
            })), 1 == this.instance) {
                var o = `${Static.componentPath}${Static.htmlURL}`, a = await fetch(o, {
                    cache: 'no-cache',
                    referrerPolicy: 'no-referrer'
                });
                if (200 != a.status && 304 != a.status) return void t(new Error(`Request for ${o} returned with ${a.status}`));
                Static.htmlText = await a.text(), document.dispatchEvent(new Event(n));
            } else null != Static.htmlText && document.dispatchEvent(new Event(n));
        }));
    }
    getCssStyleElement() {
        return new Promise((async (e, t) => {
            var n = `${Static.componentName}-css-text-ready`;
            if (document.addEventListener(n, (() => {
                var t = document.createElement('style');
                t.innerHTML = Static.cssText, e(t);
            })), 1 == this.instance) {
                var o = `${Static.componentPath}${Static.cssURL}`, a = await fetch(o, {
                    cache: 'no-cache',
                    referrerPolicy: 'no-referrer'
                });
                if (200 != a.status && 304 != a.status) return void t(new Error(`Request for ${o} returned with ${a.status}`));
                Static.cssText = await a.text(), document.dispatchEvent(new Event(n));
            } else null != Static.cssText && document.dispatchEvent(new Event(n));
        }));
    }
    identifyChildren() {
        this.toolbar = this.shadowRoot.getElementById('toolbar'), this.toolbar.isTopmostMenu = !0, 
        this.toolbar.isExpanded = !0, this.toolbarNav = this.shadowRoot.getElementById('toolbar-nav'), 
        this.toolbarTitlebar = this.shadowRoot.getElementById('toolbar-titlebar'), this.toolbarExpandButton = this.shadowRoot.getElementById('toolbar-expand-button');
    }
    determineCorner() {
        if (this.corner = 'bottom-left', this.hasAttribute('corner')) {
            var e = this.getAttribute('corner');
            -1 != e.indexOf('bottom') && -1 != e.indexOf('left') ? this.corner = 'bottom-left' : -1 != e.indexOf('bottom') && -1 != e.indexOf('right') ? this.corner = 'bottom-right' : -1 != e.indexOf('top') && -1 != e.indexOf('left') ? this.corner = 'top-left' : -1 != e.indexOf('top') && -1 != e.indexOf('right') && (this.corner = 'top-right');
        }
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
                var n = await t.json();
                if (n.toolbar && n.toolbar.titlebar && this.setTitlebar(n.toolbar.titlebar), n.panels) for (let e = 0; e < n.panels.length; e++) {
                    var o = n.panels[e].options;
                    o.tabIndex = 103 + 3 * e;
                    var a = n.panels[e].panelLines;
                    o && a && this.appendPanel(o.id, o, a);
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
        document.addEventListener('collapse-popup', this.onCollapsePopup.bind(this));
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
    appendPanel(e, t, n) {
        t.titlebar = t.titlebar || '', t.expandable = null == t.expandable || t.expandable, 
        t.dockable = null == t.dockable || t.dockable, t.tabIndex = t.tabIndex || 100, t.tooltip = t.tooltip || '';
        var o = document.createElement('menu');
        o.id = e, o.className = 'chef-list', o.isTopmostMenu = !1, o.isExpanded = !1, o.isDocked = !0, 
        this.toolbar.appendChild(o);
        var a = document.createElement('nav');
        (a.id = `${e}-nav`, a.className = 'chef-nav', o.appendChild(a), t.expandable) && ((i = this.createTitlebarButton(a, `${e}-expand-button`, 'chef-expand-button', Static.EXPAND, 'Show more', t.tabIndex + 2)).isExpanded = !1, 
        i.addEventListener('click', this.onClickExpandButton.bind(this)));
        if (t.dockable) {
            var i, r = 'top-left' == this.corner || 'bottom-left' == this.corner ? Static.FLOAT_RIGHT : Static.FLOAT_LEFT;
            (i = this.createTitlebarButton(a, `${e}-float-button`, 'chef-float-button', r, 'Detach menu', t.tabIndex + 1)).isDocked = !0, 
            i.addEventListener('click', this.onClickFloatButton.bind(this));
        }
        var l = this.createTitlebarButton(a, `${e}-titlebar`, 'chef-h2', t.titlebar, t.tooltip, t.tabIndex + 0);
        l.isTopmostMenu = !1, 0 != t.expandable && 0 != t.dockable || (l.style.width = 'var(--width-h1)'), 
        0 == t.expandable && 0 == t.dockable && (l.style.width = 'var(--width)');
        for (let e = 0; e < n.length; e++) {
            var s = n[e], d = s.lineType;
            switch (d) {
              case 'input':
                this.appendInputLine(o, s);
                break;

              case 'button':
                this.appendSingleButton(o, s);
                break;

              case 'multi-button':
                this.appendMultiButtons(o, s);
                break;

              case 'dropdown':
                this.appendDropdown(o, s);
                break;

              case 'slider+input':
                this.appendSliderWithInput(o, s);
                break;

              case 'generic':
                this.appendGenericArea(o, s);
                break;

              case 'table':
                this.appendTableArea(o, s);
                break;

              default:
                console.log(`appendPanel line ${e} specifies an unrecognized lineType "${d}"`);
            }
        }
        return o;
    }
    appendInputLine(e, t) {
        console.assert('input' == t.lineType), t.id = t.id || 'id' + Static.nextId++, t.labelText = t.labelText || '';
        var n = this.createLineWrapper(e), o = document.createElement('label');
        o.id = `${t.id}-label`, o.htmlFor = t.id, o.className = 'chef-label', o.appendChild(document.createTextNode(t.labelText)), 
        n.appendChild(o);
        var a = document.createElement('input');
        if (a.type = 'text', a.id = t.id, a.className = 'chef-input', null != t.tooltip && (a.title = t.tooltip), 
        null != t.widthInPx && (a.style.width = t.widthInPx), n.appendChild(a), null != t.textAfter) {
            var i = document.createElement('span');
            i.id = `${t.id}-after`, i.className = 'chef-after', i.appendChild(document.createTextNode(t.textAfter)), 
            n.appendChild(i);
        }
        return a;
    }
    appendSliderWithInput(e, t) {
        console.assert('slider+input' == t.lineType), t.id = t.id || 'id' + Static.nextId++, 
        t.labelText = t.labelText || '', t.textAfter = t.textAfter || '';
        var n = null == t.tooltip ? '' : `title="${t.tooltip}"`, o = null == t.widthInPx ? '' : `style='width: ${t.widthInPx}'`, a = t.numDecimals || 2, i = parseFloat(t.minPosition);
        isNaN(i) && (i = 0);
        var r = parseFloat(t.maxPosition);
        isNaN(r) && (r = 100);
        var l = parseFloat(t.stepPosition);
        isNaN(l) && (l = 1);
        var s = null != t.minValue ? parseFloat(t.minValue) : '', d = null != t.minValue ? parseFloat(t.maxValue) : '', c = t.curve || 'linear', p = null;
        p = null != t.toSlider && 'Function' == t.toSlider.constructor.name ? t.toSlider : 'log' == c ? this.toSliderLogarithmic.bind(null, i, r, s, d) : this.toSliderLinear;
        var h = null;
        h = null != t.fromSlider && 'Function' == t.fromSlider.constructor.name ? t.fromSlider : 'log' == c ? this.fromSliderLogarithmic.bind(null, i, r, s, d) : this.fromSliderLinear;
        var m = null;
        m = null != t.toUser && 'Function' == t.toUser.constructor.name ? t.toUser : this.toUserFixedDecimal.bind(null, a, s, d);
        var u = null;
        u = null != t.fromUser && 'Function' == t.fromUser.constructor.name ? t.fromUser : this.fromUserFixedDecimal.bind(null, a, s, d), 
        this.createLineWrapper(e).innerHTML = `\n\t\t\t<label id='${t.id}-label' class='chef-label'>${t.labelText}</label>\n\t\t\t<input id='${t.id}'       class='chef-input' type='text' ${n} ${o}></input>\n\t\t\t<span  id='${t.id}-after' class='chef-after'>${t.textAfter}</span>`, 
        this.createLineWrapper(e).innerHTML = `<input id='${t.id}-slider' class='chef-slider' type='range' ${n} min='${i}' max='${r}' step='${l}'></input>`;
        var b = this.shadowRoot.getElementById(`${t.id}`), f = this.shadowRoot.getElementById(`${t.id}-slider`);
        b.addEventListener('change', (e => {
            var t = b.value, n = u(t), o = p(n);
            t = m(n);
            b.value = t, f.value = o;
        })), f.addEventListener('input', (e => {
            var t = parseFloat(f.value), n = h(t), o = m(n);
            b.value = o;
        }));
    }
    fromSliderLinear(e) {
        return e;
    }
    fromSliderLogarithmic(e, t, n, o, a) {
        n = Math.log(n);
        var i = ((o = Math.log(o)) - n) / (t - e);
        return Math.exp(n + i * (a - e));
    }
    toSliderLinear(e) {
        return e;
    }
    toSliderLogarithmic(e, t, n, o, a) {
        n = Math.log(n);
        var i = ((o = Math.log(o)) - n) / (t - e);
        return (Math.log(a) - n) / i + e;
    }
    toUserFixedDecimal(e, t, n, o) {
        return parseFloat(o).toFixed(e);
    }
    fromUserFixedDecimal(e, t, n, o) {
        var a = 0 == e ? parseInt(o) : parseFloat(o);
        if ('' != t && '' != n) isNaN(a) && (a = t), a < t && (a = t), a > n && (a = n); else if (isNaN(a)) return;
        if (e > 0) {
            var i = a.toFixed(e);
            a = parseFloat(i);
        }
        return a;
    }
    appendSingleButton(e, t) {
        console.assert('button' == t.lineType), t.id = t.id || 'id' + Static.nextId++, t.buttonText = t.buttonText || 'OK';
        var n = this.createLineWrapper(e), o = document.createElement('button');
        return o.type = 'button', o.id = t.id, o.className = 'chef-command', null != t.tooltip && (o.title = t.tooltip), 
        o.appendChild(document.createTextNode(t.buttonText)), n.appendChild(o), o;
    }
    appendMultiButtons(e, t) {
        console.assert('multi-button' == t.lineType), console.assert(null != t.buttons);
        for (var n = this.createLineWrapper(e), o = [], a = 0; a < t.buttons.length; a++) {
            var i = t.buttons[a];
            i.id = i.id || 'id' + Static.nextId++, i.buttonText = i.buttonText || 'OK';
            var r = document.createElement('button');
            r.type = 'button', r.id = i.id, r.className = 'chef-command chef-one-third-command', 
            null != i.tooltip && (r.title = i.tooltip), r.appendChild(document.createTextNode(i.buttonText)), 
            n.appendChild(r), o.push(r);
        }
        return o;
    }
    appendDropdown(e, t) {
        console.assert('dropdown' == t.lineType), t.id = t.id || 'id' + Static.nextId++, 
        t.labelText = t.labelText || '';
        var n = this.createLineWrapper(e), o = document.createElement('label');
        o.htmlFor = t.id, o.className = 'chef-label', o.appendChild(document.createTextNode(t.labelText)), 
        n.appendChild(o);
        var a = document.createElement('select');
        a.id = t.id, a.className = 'chef-select', null != t.tooltip && (a.title = t.tooltip), 
        n.appendChild(a);
        for (var i = 0; i < t.selections.length; i++) {
            var r = document.createElement('option');
            r.value = t.selections[i].v, r.appendChild(document.createTextNode(t.selections[i].t)), 
            a.appendChild(r);
        }
        return a;
    }
    appendGenericArea(e, t) {
        console.assert('generic' == t.lineType), t.id = t.id || 'id' + Static.nextId++, 
        t.innerHTML = t.innerHTML || '', t.heightInPx = t.heightInPx || '100px', t.overflowY = t.overflowY || 'hidden';
        var n = this.createLineWrapper(e);
        n.style.overflowY = t.overflowY, n.style.padding = '0', n.style.height = t.heightInPx;
        var o = document.createElement('div');
        return o.id = t.id, o.className = 'chef-generic', o.innerHTML = t.innerHTML, n.appendChild(o), 
        o;
    }
    appendTableArea(e, t) {
        console.assert('table' == t.lineType), t.id = t.id || 'id' + Static.nextId++, t.innerHTML = t.innerHTML || '';
        var n = this.createLineWrapper(e);
        n.style.padding = '0', t.minHeightInPx && (n.style.minHeight = t.minHeightInPx), 
        t.maxHeightInPx && (n.style.maxHeight = t.maxHeightInPx), t.heightInPx ? n.style.height = t.heightInPx : n.style.height = '100%', 
        t.overflowY ? n.style.overflowY = t.overflowY : n.style.overflowY = 'auto';
        var o = document.createElement('table');
        return o.id = t.id, o.className = 'chef-table', o.style.width = '100%', o.innerHTML = t.innerHTML, 
        n.appendChild(o), o;
    }
    createTitlebarButton(e, t, n, o, a, i) {
        var r = document.createElement('button');
        return r.type = 'button', r.id = t, r.className = n, r.tabIndex = i, r.title = a, 
        r.appendChild(document.createTextNode(o)), e.appendChild(r), r;
    }
    createLineWrapper(e) {
        var t = document.createElement('div');
        return t.className = 'chef-line', e.appendChild(t), t;
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
        var t = this.getMenuElement(e), n = this.getExpandButton(e);
        t && n && this.expandCollapseHelper(t, n, 'expand');
    }
    collapsePanel(e) {
        var t = this.getMenuElement(e), n = this.getExpandButton(e);
        t && n && this.expandCollapseHelper(t, n, 'collapse');
    }
    onClickExpandButton(e) {
        var t = e.target;
        if ('BUTTON' == t.tagName) {
            var n = t.parentNode;
            if ('NAV' == n.tagName) {
                var o = n.parentNode;
                if ('MENU' == o.tagName) {
                    var a = o.isExpanded ? 'collapse' : 'expand';
                    this.expandCollapseHelper(o, t, a), e.stopPropagation();
                }
            }
        }
    }
    expandCollapseHelper(e, t, n) {
        e.isTopmostMenu ? e.style.display = 'block' : e.isDocked ? this.toolbar.isExpanded ? e.style.display = 'block' : e.style.display = 'none' : e.style.display = 'block';
        for (var o = 0; o < e.children.length; o++) {
            var a = e.children[o];
            (e.isTopmostMenu && ('chef-list' == a.className || 'chef-menuitem' == a.className) || !e.isTopmostMenu && 'chef-line' == a.className) && (a.style.display = 'expand' == n ? 'block' : 'none');
        }
        1 == e.isTopmostMenu ? 'expand' == n ? (this.toolbarTitlebar.style.display = 'block', 
        e.style.width = 'var(--width)', t.innerHTML = Static.TOPMOST_OPEN, t.title = 'Close', 
        this.collapseOtherPopups()) : (this.toolbarTitlebar.style.display = 'none', e.style.width = '24px', 
        t.innerHTML = Static.TOPMOST_CLOSED, t.title = 'Open') : 'expand' == n ? (t.innerHTML = Static.COLLAPSE, 
        t.title = 'Show less') : (t.innerHTML = Static.EXPAND, t.title = 'Show more'), e.isExpanded = 'expand' == n;
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
    detachPanel(e) {
        var t = this.getMenuElement(e), n = this.getFloatButton(e);
        t && n && this.floatDockHelper(t, n, 'float');
    }
    attachPanel(e) {
        var t = this.getMenuElement(e), n = this.getFloatButton(e);
        t && n && this.floatDockHelper(t, n, 'dock');
    }
    presetDetachablePanelPosition(e, t, n, o, a) {
        var i = this.getMenuElement(e);
        null != i && 'MENU' == i.tagName && (i.savePosition = {
            top: t,
            left: n,
            bottom: o,
            right: a
        });
    }
    onClickFloatButton(e) {
        var t = e.target;
        if ('BUTTON' == t.tagName) {
            var n = t.parentNode;
            if ('NAV' == n.tagName) {
                var o = n.parentNode;
                if ('MENU' == o.tagName) {
                    var a = o.isDocked ? 'float' : 'dock';
                    this.floatDockHelper(o, t, a), e.stopPropagation();
                }
            }
        }
    }
    nextFloatDeltaX() {
        return this.nextFloatLeft = this.nextFloatLeft > 100 ? 0 : this.nextFloatLeft + 10, 
        this.nextFloatLeft;
    }
    floatDockHelper(e, t, n) {
        if ('float' == n) {
            if (0 == e.isDocked) return;
            var o = document.createElement('div');
            o.style.display = 'none', e.parentNode.insertBefore(o, e), e.saveReferenceNode = o, 
            e.saveParentNode = e.parentNode, (d = document.createElement('menu')).className = 'chef-toolbar', 
            e.boundPointerdownToolbar = this.onPointerdownToolbar.bind(this), e.addEventListener('pointerdown', e.boundPointerdownToolbar);
            var a = e.savePosition, i = null != a, r = this.nextFloatDeltaX();
            if ('top-left' == this.corner || 'bottom-left' == this.corner) if (i) d.style.left = a.left; else {
                var l = e.offsetLeft + e.offsetParent.offsetLeft + e.offsetWidth + 13 + r;
                d.style.left = l + 'px';
            } else if (i) d.style.right = a.right; else {
                l = this.pxToNum(window.getComputedStyle(this.toolbar).getPropertyValue('right')) + this.toolbar.offsetWidth + 13 + r;
                d.style.right = l + 'px';
            }
            if ('top-left' == this.corner || 'top-right' == this.corner) if (i) d.style.top = a.top; else {
                var s = e.offsetTop + e.offsetParent.offsetTop;
                d.style.top = s + 'px';
            } else if (i) d.style.bottom = a.bottom; else {
                s = this.pxToNum(window.getComputedStyle(this.toolbar).getPropertyValue('bottom')) + this.toolbar.offsetHeight - e.offsetTop - e.offsetHeight;
                d.style.bottom = s + 'px';
            }
            this.shadowRoot.appendChild(d), d.appendChild(e), t.innerHTML = 'top-left' == this.corner || 'bottom-left' == this.corner ? Static.COLLAPSE_RIGHT : Static.COLLAPSE_LEFT, 
            t.title = 'Dock menu', e.isDocked = !1, this.expandPanel(e.id), e.style.zIndex = this.nextZIndex++;
        } else {
            if (1 == e.isDocked) return;
            var d = e.parentNode;
            e.savePosition = {}, e.savePosition.left = d.style.left, e.savePosition.right = d.style.right, 
            e.savePosition.top = d.style.top, e.savePosition.bottom = d.style.bottom, e.saveParentNode.insertBefore(e, e.saveReferenceNode), 
            e.saveParentNode.removeChild(e.saveReferenceNode), d.parentNode.removeChild(d), 
            e.removeEventListener('pointerdown', e.boundPointerdownToolbar), e.saveParentNode.isExpanded || (e.style.display = 'none'), 
            t.innerHTML = 'top-left' == this.corner || 'bottom-left' == this.corner ? Static.FLOAT_RIGHT : Static.FLOAT_LEFT, 
            t.title = 'Detach menu', e.isDocked = !0, this.collapsePanel(e.id);
        }
    }
    onPointerdownToolbar(e) {
        if ('chef-expand-button' != e.target.className && 'chef-float-button' != e.target.className) {
            for (var t = e.target, n = null; null == n; ) if (-1 != t.className.indexOf('chef-toolbar')) n = t; else {
                if (-1 != t.className.indexOf('chef-line')) return;
                if ('#document-fragment' == t.parentNode.nodeName) return;
                t = t.parentNode;
            }
            'top-left' == this.corner || 'bottom-left' == this.corner ? n.startingElementX = n.offsetLeft : n.startingElementX = this.pxToNum(window.getComputedStyle(n).getPropertyValue('right')), 
            'top-left' == this.corner || 'top-right' == this.corner ? n.startingElementY = n.offsetTop : n.startingElementY = this.pxToNum(window.getComputedStyle(n).getPropertyValue('bottom')), 
            n.startingMouseX = e.pageX, n.startingMouseY = e.pageY, n.boundPointermoveToolbar = this.onPointermoveToolbar.bind(this), 
            n.addEventListener('pointermove', n.boundPointermoveToolbar), n.boundPointerupToolbar = this.onPointerupToolbar.bind(this), 
            n.addEventListener('pointerup', n.boundPointerupToolbar), n.style.zIndex = this.nextZIndex++, 
            n.setPointerCapture(e.pointerId), e.stopPropagation();
        }
    }
    onPointermoveToolbar(e) {
        var t = e.currentTarget;
        if ('top-left' == this.corner) {
            var n = t.startingElementY - (t.startingMouseY - e.pageY), o = t.startingElementX - (t.startingMouseX - e.pageX);
            t.style.top = n + 'px', t.style.left = o + 'px';
        } else if ('bottom-left' == this.corner) {
            n = t.startingElementY + (t.startingMouseY - e.pageY), o = t.startingElementX - (t.startingMouseX - e.pageX);
            t.style.bottom = n + 'px', t.style.left = o + 'px';
        } else if ('top-right' == this.corner) {
            n = t.startingElementY - (t.startingMouseY - e.pageY), o = t.startingElementX + (t.startingMouseX - e.pageX);
            t.style.top = n + 'px', t.style.right = o + 'px';
        } else if ('bottom-right' == this.corner) {
            n = t.startingElementY + (t.startingMouseY - e.pageY), o = t.startingElementX + (t.startingMouseX - e.pageX);
            t.style.bottom = n + 'px', t.style.right = o + 'px';
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
                var n = e[e.length - 2].charAt(0);
                (n < 'a' || n > 'z') && (n = 'q'), t = n.charCodeAt(n) - 97, t = Math.max(t, 0), 
                t = Math.min(t, 25);
            }
            var o = new Date;
            o.setUTCMonth(0, 1);
            var a = (Math.floor((Date.now() - o) / 864e5) + 1) % 26, i = window.location.hostname, r = `Unregistered ${Static.componentName} component.`;
            try {
                var l = (await import('../../rwt-registration-keys.js')).default;
                for (let e = 0; e < l.length; e++) {
                    var s = l[e];
                    if (s.hasOwnProperty('product-key') && s['product-key'] == Static.componentName) return i != s.registration && console.warn(`${r} See https://readwritetools.com/licensing.blue to learn more.`), 
                    void (a == t && window.setTimeout(this.authenticate.bind(this, s), 1e3));
                }
                console.warn(`${r} rwt-registration-key.js file missing "product-key": "${Static.componentName}"`);
            } catch (e) {
                console.warn(`${r} rwt-registration-key.js missing from website's root directory.`);
            }
        }
    }
    async authenticate(e) {
        var t = encodeURIComponent(window.location.hostname), n = encodeURIComponent(window.location.href), o = encodeURIComponent(e.registration), a = encodeURIComponent(e['customer-number']), i = encodeURIComponent(e['access-key']), r = {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: `product-name=${Static.componentName}&hostname=${t}&href=${n}&registration=${o}&customer-number=${a}&access-key=${i}`
        };
        try {
            var l = await fetch('https://validation.readwritetools.com/v1/genuine/component', r);
            if (200 == l.status) await l.json();
        } catch (e) {
            console.info(e.message);
        }
    }
}

window.customElements.define(Static.componentName, RwtDockablePanels);