//=============================================================================
//
// File:         /node_modules/rwt-dockable-panels/rwt-dockable-panels.js
// Language:     ECMAScript 2015
// Copyright:    Read Write Tools © 2020
// License:      MIT
// Initial date: Oct 31, 2020
// Contents:     Collapsable and dockable panels
//
//=============================================================================

const Static = {
	componentName:    'rwt-dockable-panels',
	elementInstance:  1,
	htmlURL:          '/node_modules/rwt-dockable-panels/rwt-dockable-panels.blue',
	cssURL:           '/node_modules/rwt-dockable-panels/rwt-dockable-panels.css',
	htmlText:         null,
	cssText:          null,
	nextId:           1
};

Object.seal(Static);

//  The optional sourceref config file should contain a JSON structure like this:
/*
{
	"toolbar": {
		"titlebar"
	},
	"panels": [
		{
			"options": {
				"id"
				"titlebar"
				"tabIndex"
				"tooltip"
			},
			"panelLines": [{
					"lineType"
					"id"
					"labelText"
					"textAfter"
					"tooltip"
				},
				...
			]
		},
		...
	]
}
*/

export default class RwtDockablePanels extends HTMLElement {

	constructor() {
		super();
		
		// guardrails
		this.instance = Static.elementInstance++;
		this.isComponentLoaded = false;

		// properties
		this.collapseSender = `${Static.componentName} ${this.instance}`;
		this.corner = null;

		// child elements
		this.toolbar = null;
		
		Object.seal(this);
	}
	
	//-------------------------------------------------------------------------
	// customElement life cycle callback
	//-------------------------------------------------------------------------
	async connectedCallback() {		
		if (!this.isConnected)
			return;
		
		try {
			var htmlFragment = await this.getHtmlFragment();
			var styleElement = await this.getCssStyleElement();

			this.attachShadow({mode: 'open'});
			this.shadowRoot.appendChild(htmlFragment); 
			this.shadowRoot.appendChild(styleElement); 
			
			this.identifyChildren();
			this.registerEventListeners();
			await this.getConfiguredPanels();
			this.determineCorner();
			this.sendComponentLoaded();
		}
		catch (err) {
			console.log(err.message);
		}
	}
	
	//-------------------------------------------------------------------------
	// initialization
	//-------------------------------------------------------------------------

	// Only the first instance of this component fetches the HTML text from the server.
	// All other instances wait for it to issue an 'html-template-ready' event.
	// If this function is called when the first instance is still pending,
	// it must wait upon receipt of the 'html-template-ready' event.
	// If this function is called after the first instance has already fetched the HTML text,
	// it will immediately issue its own 'html-template-ready' event.
	// When the event is received, create an HTMLTemplateElement from the fetched HTML text,
	// and resolve the promise with a DocumentFragment.
	getHtmlFragment() {
		return new Promise(async (resolve, reject) => {
			var htmlTemplateReady = `${Static.componentName}-html-template-ready`;
			
			document.addEventListener(htmlTemplateReady, () => {
				var template = document.createElement('template');
				template.innerHTML = Static.htmlText;
				resolve(template.content);
			});
			
			if (this.instance == 1) {
				var response = await fetch(Static.htmlURL, {cache: "no-cache", referrerPolicy: 'no-referrer'});
				if (response.status != 200 && response.status != 304) {
					reject(new Error(`Request for ${Static.htmlURL} returned with ${response.status}`));
					return;
				}
				Static.htmlText = await response.text();
				document.dispatchEvent(new Event(htmlTemplateReady));
			}
			else if (Static.htmlText != null) {
				document.dispatchEvent(new Event(htmlTemplateReady));
			}
		});
	}
	
	// Use the same pattern to fetch the CSS text from the server
	// When the 'css-text-ready' event is received, create an HTMLStyleElement from the fetched CSS text,
	// and resolve the promise with that element.
	getCssStyleElement() {
		return new Promise(async (resolve, reject) => {
			var cssTextReady = `${Static.componentName}-css-text-ready`;

			document.addEventListener(cssTextReady, () => {
				var styleElement = document.createElement('style');
				styleElement.innerHTML = Static.cssText;
				resolve(styleElement);
			});
			
			if (this.instance == 1) {
				var response = await fetch(Static.cssURL, {cache: "no-cache", referrerPolicy: 'no-referrer'});
				if (response.status != 200 && response.status != 304) {
					reject(new Error(`Request for ${Static.cssURL} returned with ${response.status}`));
					return;
				}
				Static.cssText = await response.text();
				document.dispatchEvent(new Event(cssTextReady));
			}
			else if (Static.cssText != null) {
				document.dispatchEvent(new Event(cssTextReady));
			}
		});
	}

	//^ Fetch the user-specified JSON configuration file specified in
	//  the custom element's sourceref attribute, which is a URL.
	async getConfiguredPanels() {
		if (this.hasAttribute('sourceref') == false)
			return;
		var sourceref = this.getAttribute('sourceref');
		
		try {
			var response = await fetch(sourceref, {cache: "no-cache", referrerPolicy: 'no-referrer'});		// send conditional request to server with ETag and If-None-Match
			if (response.status != 200 && response.status != 304)
				return null;
			var config = await response.json();
			
			if (config.toolbar && config.toolbar.titlebar)
				this.setTitlebar(config.toolbar.titlebar);

			if (config.panels) {
				for (let i=0; i < config.panels.length; i++) {
					var options = config.panels[i].options;
					var panelLines = config.panels[i].panelLines;
					if (options && panelLines) {
						this.appendPanel(options.id, options, panelLines);
					}
				}
			}
		}
		catch(err) {
			console.log(err.message);
		}
	}
	
	//^ Identify this component's children
	identifyChildren() {
		this.toolbar = this.shadowRoot.getElementById('toolbar');
		this.toolbar.isTopmostMenu = true;
		this.toolbar.isExpanded = true;
	}		

	registerEventListeners() {
		// component events
		this.shadowRoot.getElementById('toolbar-titlebar').addEventListener('pointerdown', this.onPointerDownTitlebar.bind(this));
		this.shadowRoot.getElementById('toolbar-expand-button').addEventListener('click', this.onClickExpandButton.bind(this));
	}

	determineCorner() {
		this.corner = 'bottom-left';

		if (this.hasAttribute('corner')) {
			var attr = this.getAttribute('corner');
			if (attr.indexOf('bottom') != -1 && attr.indexOf('left') != -1)
				this.corner = 'bottom-left';
			else if (attr.indexOf('bottom') != -1 && attr.indexOf('right') != -1)
				this.corner = 'bottom-right';
			else if (attr.indexOf('top') != -1 && attr.indexOf('left') != -1)
				this.corner = 'top-left';
			else if (attr.indexOf('top') != -1 && attr.indexOf('right') != -1)
				this.corner = 'top-right';
		}
		
		this.toolbar.className = `${this.corner} chef-toolbar`;		// bottom-left, bottom-right, top-left, top-right
	}

	//^ Inform the document's custom element that it is ready for programmatic use 
	sendComponentLoaded() {
		this.isComponentLoaded = true;
		this.dispatchEvent(new Event('component-loaded', {bubbles: true}));
	}

	//^ A Promise that resolves when the component is loaded
	waitOnLoading() {
		return new Promise((resolve) => {
			if (this.isComponentLoaded == true)
				resolve();
			else
				this.addEventListener('component-loaded', resolve);
		});
	}
	
	//-------------------------------------------------------------------------
	// configuration
	//-------------------------------------------------------------------------

	//^ sets the topmost menu titlebar
	setTitlebar(htmlText) {
		this.shadowRoot.getElementById('toolbar-titlebar').innerHTML = htmlText;
	}
	
	//^ Append a new panel to the component
	//> panelID is a String which will be the identifer for the panel
	//> options is an anonymous object having { titlebar, expandable, docable, tabIndex, tooltip }
	//> panelLines is an array of anonymous objects each containing the options
	//  for a single line within the panel area below the titlebar, and where
	//  the lineType determines which other properties are used.
	//< returns elPanel, the <MENU> created by this function
	appendPanel(panelId, options, panelLines) {

		options.titlebar 	= options.titlebar 		|| '';
		options.expandable 	= (options.expandable == undefined) ? true : options.expandable;
		options.dockable 	= (options.dockable == undefined) ? true : options.dockable;
		options.tabIndex 	= options.tabIndex 		|| 100;
		options.tooltip 	= options.tooltip 		|| '';
		
		var elPanel = document.createElement('menu');
		elPanel.id = panelId; 
		elPanel.className = 'chef-list';
		elPanel.isTopmostMenu = false;			// only the toolbar is topmost
		elPanel.isExpanded = false;				// topmost menu defaults to expanded, other menus default to collapsed
		elPanel.isDocked = true;				// defaults to docked
		this.toolbar.appendChild(elPanel);
		
		// A group of elements for expanding-collapsing a menu, and docking-floating a menu
		//   <nav id="panel-nav" class="chef-nav">
		//      <button id="panel-nav-expand" class="chef-expand" type="button" tabindex="202">+</button>
		//      <button id="panel-nav-float" class="chef-float" type="button" tabindex="203">~</button>
		//      <button id="panel-nav-titlebar" class="chef-h2" tabindex="201">Position</button>
		//   </nav>
		
		var elNav = document.createElement('nav');
		elNav.id = `${panelId}-nav`;
		elNav.className = 'chef-nav';
		elPanel.appendChild(elNav);
	
		// these two control buttons are styled with a float and need to be above the h2 
		if (options.expandable) {
			var el = this.createTitlebarButton(elNav, `${panelId}-expand-button`, 'chef-expand-button', '+', 'Show more', options.tabIndex+2);
			el.isExpanded = false;
			el.addEventListener('click', this.onClickExpandButton.bind(this));
		}
		if (options.dockable) {
			var el = this.createTitlebarButton(elNav, `${panelId}-float-button`, 'chef-float-button', '~', 'Detach menu', options.tabIndex+1);
			el.isDocked = true;
			el.addEventListener('click', this.onClickFloatButton.bind(this));
		}

		var elTitlebar = this.createTitlebarButton(elNav, `${panelId}-titlebar`, 'chef-h2', options.titlebar, options.tooltip, options.tabIndex+0);
		elTitlebar.isTopmostMenu = false;
		if (options.expandable == false || options.dockable == false)
			elTitlebar.style.width = 'var(--width-h1)';				
		if (options.expandable == false && options.dockable == false)
			elTitlebar.style.width = 'var(--width)';				
		
		// allow dockable menus to be moved by the mouse
		if (options.dockable)
			elTitlebar.addEventListener('pointerdown', this.onPointerDownTitlebar.bind(this));
		
		// create elements for the specified lines
		for (let i=0; i < panelLines.length; i++) {
			var lineOptions = panelLines[i];
			var lineType = lineOptions.lineType;
			
			switch (lineType) {
				case 'input':
					this.appendInputLine(elPanel, lineOptions);
					break;
					
				case 'button':
					this.appendSingleButton(elPanel, lineOptions);
					break;
				
				case 'multi-button':
					this.appendMultiButtons(elPanel, lineOptions);
					break;
				
				case 'dropdown':
					this.appendDropdown(elPanel, lineOptions);
					break;

				case 'generic':
					this.appendGenericArea(elPanel, lineOptions);
					break;
					
				default:
					console.log(`appendPanel line ${i} specifies an unrecognized lineType "${lineType}"`);
					break;
			}
		}
		return elPanel;
	}
	
	//-----------------------------------------------
	//^ The appendInputLine function creates a line with a label and an input
	//> elPanel is the <MENU> created by appendPanel
	//> options has these properties { lineType, id, labelText, tooltip, widthInPx, textAfter }
	//> id is the identifier to be assigned to the <INPUT> being created
	//> labelText is the text to be displayed in the <LABEL> before the <INPUT>
	//> tooltip is the text to display on hover, optional
	//> widthInPx is a string value specifying the width of the input field, with a trailing 'px', optional
	//> textAfter is the optional short text to display after the INPUT, optional
	//< returns the <INPUT> element created by this function
	appendInputLine(elPanel, options) {
		console.assert(options.lineType == 'input');
		options.id = options.id || `id${Static.nextId++}`;
		options.labelText = options.labelText || '';
		
		var div = this.createLineWrapper(elPanel);
	
		var elLabel = document.createElement('label');
		elLabel.id = `${options.id}-label`;
		elLabel.htmlFor = options.id;
		elLabel.className = 'chef-label';
		elLabel.appendChild(document.createTextNode(options.labelText));
		div.appendChild(elLabel);
		
		var elInput = document.createElement('input');
		elInput.type = 'text';
		elInput.id = options.id;
		elInput.className = 'chef-input';
		if (options.tooltip != undefined)
			elInput.title = options.tooltip;
		if (options. widthInPx != undefined)
			elInput.style.width = widthInPx;
		div.appendChild(elInput);
	
		if (options.textAfter != undefined)
		{
			var elSpan = document.createElement('span');
			elSpan.id = `${options.id}-after`;
			elSpan.className = 'chef-after';
			elSpan.appendChild(document.createTextNode(options.textAfter));
			div.appendChild(elSpan);
		}
		
		return elInput;
	}
	
	//-----------------------------------------------
	//^ The appendSingleButton function creates an internal button for doing something user-defined
	//> elPanel is the <MENU> created by appendPanel
	//> options has these properties { lineType, id, buttonText, tooltip }
	//> id is the identifier to be assigned to the <BUTTON> being created
	//> buttonText is the text to be displayed in the button
	//> tooltip is the text to display on hover, optional
	//< returns the <BUTTON> element created by this function
	appendSingleButton(elPanel, options) {
		console.assert(options.lineType == 'button');
		options.id = options.id || `id${Static.nextId++}`;
		options.buttonText = options.buttonText || 'OK';

		var div = this.createLineWrapper(elPanel);
		
		var elButton = document.createElement('button');
		elButton.type = 'button';
		elButton.id = options.id;
		elButton.className = 'chef-command';
		if (options.tooltip != undefined)
			elButton.title = options.tooltip;
		elButton.appendChild(document.createTextNode(options.buttonText));
		div.appendChild(elButton);
		
		return elButton;
	}
	
	//^ The appendMultiButtons function creates multiple buttons that logically work together and visually appear on one line
	//> elPanel is the <MENU> created by appendPanel
	//> options has these properties { lineType, buttons }
	//> buttons is an array of objects, each with:
	//   id is the identifier to be assigned to the <BUTTON> being created
	//   buttonText is the text to be displayed in the button
	//   tooltip is the text to display on hover, optional
	//< returns an array containing the <BUTTON> elements created by this function
	appendMultiButtons(elPanel, options) {
		console.assert(options.lineType == 'multi-button');
		console.assert(options.buttons != undefined);

		var div = this.createLineWrapper(elPanel);
		var elements = [];
		
		for (var i = 0; i < options.buttons.length; i++)
		{
			var def = options.buttons[i];
			def.id = def.id || `id${Static.nextId++}`;
			def.buttonText = def.buttonText || 'OK';
			
			var elButton = document.createElement('button');
			elButton.type = 'button';
			elButton.id = def.id;
			elButton.className = 'chef-command chef-one-third-command';
			if (def.tooltip != undefined)
				elButton.title = def.tooltip;
			elButton.appendChild(document.createTextNode(def.buttonText));
			div.appendChild(elButton);
			elements.push(elButton);
		}
		
		return elements;
	}

	//-----------------------------------------------
	//^ The appendDropdown function creates a line with a label and a select
	//> elPanel is the <MENU> created by appendPanel
	//> options has these properties { lineType, id, labelText, selections, tooltip }
	//> id is the identifier to be assigned to the <INPUT> being created
	//> labelText is the text to be displayed in the <LABEL> before the <SELECT>
	//> selections is an array of objects with two properties: {v, t}
	//   'v' is the value to use internally
	//   't' is the text to show the user
	//> tooltip is the text to display on hover, optional
	//< returns the <SELECT> element created by this function
	appendDropdown(elPanel, options) {
		console.assert(options.lineType == 'dropdown');
		options.id = options.id || `id${Static.nextId++}`;
		options.labelText = options.labelText || '';

		var div = this.createLineWrapper(elPanel);
	
		var elLabel = document.createElement('label');
		elLabel.htmlFor = options.id;
		elLabel.className = 'chef-label';
		elLabel.appendChild(document.createTextNode(options.labelText));
		div.appendChild(elLabel);
		
		var elSelect = document.createElement('select');
		elSelect.id = options.id;
		elSelect.className = 'chef-select';
		if (options.tooltip != undefined)
			elSelect.title = options.tooltip;
		div.appendChild(elSelect);
		
		for (var i = 0; i < options.selections.length; i++) {
			var elOption = document.createElement('option');
			elOption.value = options.selections[i].v;
			elOption.appendChild(document.createTextNode(options.selections[i].t));
			elSelect.appendChild(elOption);
		}
		
		return elSelect;
	}

	//^ The appendGenericArea function creates a div suitable for use with dynamic HTML
	//> id is the identifier to be assigned to the <DIV> being created
	//> innerHTML is the text to be displayed 
	//> heightInPx is a number of pixels, expressed as a string ending in 'px', like '156px'
	//> overflowY is either 'scroll' or 'hidden', optional
	//< returns the <DIV> element created by this function
	appendGenericArea(elPanel, options)
	{
		console.assert(options.lineType == 'generic');
		options.id = options.id || `id${Static.nextId++}`;
		options.innerHTML = options.innerHTML || '';
		options.heightInPx = options.heightInPx || '100px';
		options.overflowY = options.overflowY || 'hidden';
		
		var div = this.createLineWrapper(elPanel);
		div.style.overflowY = options.overflowY;
		div.style.padding = '0';
		div.style.height = options.heightInPx;
		
		var elDiv = document.createElement('div');
		elDiv.id = options.id;
		elDiv.className = 'chef-generic';
		elDiv.innerHTML = options.innerHTML;
		div.appendChild(elDiv);
		
		return elDiv;
	}	

	//-------------------------------------------------------------------------
	// Helpers
	//-------------------------------------------------------------------------
	
	//^ The createTitlebarButton function is a private function for adding +/-  or ~/^ buttons or the titlebar text
	//> nav is the <NAV> parent element
	//> buttonId is the new button's identifier
	//> classname is either 'chef-expand-button' or 'chef-float-button'
	//> elementText is the single character to use with the button  +/-  or ~/^ or the titlebar text
	//> tabIndex is an integer value
	createTitlebarButton(nav, buttonId, classname, elementText, tooltip, tabIndex)
	{
		var el = document.createElement('button');
		el.type = 'button';
		el.id = buttonId;
		el.className = classname
		el.tabIndex = tabIndex;
		el.title = tooltip;
		el.appendChild(document.createTextNode(elementText));
		nav.appendChild(el);
		return el;
	}
	
	//^ The createLineWrapper function is a private function that creates a <DIV>
	//  for use as a parent to individual lines of <INPUT>, <SELECT> and <BUTTON> items
	//< returns the DIV element
	createLineWrapper(elPanel)
	{
		var el = document.createElement('div');
		el.className = 'chef-line';
		elPanel.appendChild(el);
		return el;
	}
		
	//-------------------------------------------------------------------------
	// Expand - Collapse
	//-------------------------------------------------------------------------
	
	//	<menu id="panel-menu" class="chef-list">
	//		<nav id="panel-nav" class="chef-nav">
	//			<button id="panel-expand-button" class="chef-expand-button" >+</button>
	//		</nav>
	//		<div class="chef-line">
	//		<div class="chef-line">
	//	</menu>

	//^ The onClickExpandButton function toggles between collapsed and expanded
	onClickExpandButton(event) {	
		var button = event.target;
		if (button.tagName != 'BUTTON')
			return;
		
		var nav = button.parentNode;
		if (nav.tagName != 'NAV')
			return;
		
		var menu = nav.parentNode;
		if (menu.tagName != 'MENU')
			return;
	
		var expandCollapse = menu.isExpanded ? 'collapse' : 'expand';
		this.expandCollapseHelper(menu, nav, button, expandCollapse);
	
		event.stopPropagation();
	}
	
	
	//^ The expandCollapseHelper  function
	//> menu is the parent <MENU> element
	//> nav is the inner <NAV> element
	//> button is the clickable <BUTTON> element
	//> expandCollapse is 'expand' or 'collapse'
	expandCollapseHelper(menu, nav, button, expandCollapse) {
		// show/hide all the lines
		for (var i = 0; i < menu.children.length; i++) {
			var child = menu.children[i];
			if ((menu.isTopmostMenu && (child.className == 'chef-list' || child.className == 'chef-menuitem')) ||
			    (!menu.isTopmostMenu && (child.className == 'chef-line')))
			   		child.style.display = (expandCollapse == 'expand') ? 'block' : 'none';
		}
	
		// if this is the topmost, hide the label too
		if (menu.isTopmostMenu) {
			for (var i = 0; i < nav.children.length; i++)
			{
				if (nav.children[i].className == 'chef-h1')
					nav.children[i].style.display = (expandCollapse == 'expand') ? 'block' : 'none';
			}
			menu.style.width = (expandCollapse == 'expand') ? 'var(--width)' : '24px';
			//menu.style.width = (expandCollapse == 'expand') ? '250px' : '24px';
			//menu.style.left = '';
			//menu.style.right = '2px';
			//menu.style.top = '2px';
		}
		
		button.innerHTML = (expandCollapse == 'expand') ? '-' : '+';
		button.title = (expandCollapse == 'expand') ? 'Show less' : 'Show more';
		menu.isExpanded = (expandCollapse == 'expand') ? true : false;
	
		var event = new Event(expandCollapse);
		menu.dispatchEvent(event);
	}

	//> id is the DOM identifier of the menu to expand
	expandMenu(id) {
		var menu = document.getElementById(id);
		if (menu.tagName != 'MENU')
			return;
	
		var nav = document.getElementById(id + '_nav');
		if (nav.tagName != 'NAV')
			return;
		
		var button = document.getElementById(id + '_expand');
		if (button.tagName != 'BUTTON')
			return;
		
		this.expandCollapseHelper(menu, nav, button, 'expand');
	}
	
	
	//> id is the DOM identifier of the menu to collapse
	collapseMenu(id) {
		var menu = document.getElementById(id);
		if (menu.tagName != 'MENU')
			return;
	
		var nav = document.getElementById(id + '_nav');
		if (nav.tagName != 'NAV')
			return;
		
		var button = document.getElementById(id + '_expand');
		if (button.tagName != 'BUTTON')
			return;
		
		this.expandCollapseHelper(menu, nav, button, 'collapse');
	}

	//-------------------------------------------------------------------------
	// Dock - Float
	//-------------------------------------------------------------------------
	
	//	<menu id="panel-menu" class="chef-list">
	//		<nav id="panel-nav" class="chef-nav">
	//			<button id="panel-float-button" class="chef-float-button" >+</button>
	//		</nav>
	//		<div class="chef-line">
	//		<div class="chef-line">
	//	</menu>

	//^ The onClickFloatButton function toggles between docked and floating
	onClickFloatButton(event) {	
		var button = event.target;
		if (button.tagName != 'BUTTON')
			return;
		
		var nav = button.parentNode;
		if (nav.tagName != 'NAV')
			return;
		
		var menu = nav.parentNode;
		if (menu.tagName != 'MENU')
			return;
		
		var dockedFloated = menu.isDocked ? 'float' : 'dock';
		this.floatDockHelper(menu, nav, button, dockedFloated);
		
		event.stopPropagation();
	}
		
	//^ The floatDockHelper function
	//> menu is the parent <MENU> element
	//> nav is the inner <NAV> element
	//> button is the clickable <BUTTON> element
	//> dockedFloated is 'float' or 'dock'
	 floatDockHelper(menu, nav, button, dockedFloated) {
		if (dockedFloated == 'float')
		{
			// create a placeholder for redocking and insert it just before the menu being floated
			var placeholderNode = document.createElement('div');
			placeholderNode.style.display = 'none';
			menu.parentNode.insertBefore(placeholderNode, menu);
			menu.saveReferenceNode = placeholderNode;
			menu.saveParentNode = menu.parentNode;
	
			// create toolbar, append toolbar to shadow root, append menu to toolbar
			var floatParentNode = document.createElement('menu');
			floatParentNode.className = 'chef-toolbar';
			
			// place the floating parent just left or right of the submenu's docked position
			var x = menu.offsetLeft + menu.offsetParent.offsetLeft;
			var y = menu.offsetTop + menu.offsetParent.offsetTop;
			if (this.corner.indexOf('-left') != -1)
				x = x + (menu.offsetWidth + 13);
			else  // this.corner.indexOf('-right') != -1)
				x = x - (menu.offsetWidth + 13);
			floatParentNode.style.left = x + 'px';
			floatParentNode.style.top = y + 'px';
			this.shadowRoot.appendChild(floatParentNode);
			
			// move the submenu to the new floating parent
			floatParentNode.appendChild(menu);
	
			button.innerHTML = '^';
			button.title = 'Dock menu';
			menu.isDocked = false;
		}
		
		else // (dockedFloated == 'dock')
		{
			var floatParentNode = menu.parentNode;
			menu.saveParentNode.insertBefore(menu, menu.saveReferenceNode);
			menu.saveParentNode.removeChild(menu.saveReferenceNode);
			floatParentNode.parentNode.removeChild(floatParentNode);
			
			// if the toolbar is collapsed, hide the panel's elements
			if (!menu.saveParentNode.isExpanded)
				menu.style.display = 'none';
	
			button.innerHTML = '~';
			button.title = 'Detach menu';
			menu.isDocked = true;
		}
		
		var event = new Event(dockedFloated);
		menu.dispatchEvent(event);
	}
	 
	//> id is the DOM identifier of the menu to float
	 floatMenu(id) {
		var menu = document.getElementById(id);
		if (menu.tagName != 'MENU')
			return;
	
		var nav = document.getElementById(id + '_nav');
		if (nav.tagName != 'NAV')
			return;
		
		var button = document.getElementById(id + '_float');
		if (button.tagName != 'BUTTON')
			return;
		
		this.floatDockHelper(menu, nav, button, 'float');
	}
	
	//> id is the DOM identifier of the menu to dock
	dockMenu(id) {
		var menu = document.getElementById(id);
		if (menu.tagName != 'MENU')
			return;
	
		var nav = document.getElementById(id + '_nav');
		if (nav.tagName != 'NAV')
			return;
		
		var button = document.getElementById(id + '_float');
		if (button.tagName != 'BUTTON')
			return;
		
		this.floatDockHelper(menu, nav, button, 'dock');
	}
	
	//-------------------------------------------------------------------------
	// Dragging titlebars
	//-------------------------------------------------------------------------
	
	onPointerDownTitlebar(event) {
		var elTitlebar = event.target;
		var identifier = elTitlebar.id;
	
		if (elTitlebar.tagName != 'BUTTON')
			return;
		
		var nav = elTitlebar.parentNode;
		if (nav.tagName != 'NAV')
			return;
		
		var menu = nav.parentNode;
		if (menu.tagName != 'MENU')
			return;
	
		// only move the 'chef-h1' menu ,or 'chef-h2' floating menus
		if (!menu.isTopmostMenu && menu.isDocked)
			return;
		
		var xy1 = this.normalizedElementXY(elTitlebar);
		var xy2 = this.normalizedMouseXY(event);
		elTitlebar.mouseOffsetX = xy2.x - xy1.x;
		elTitlebar.mouseOffsetY = xy2.y - xy1.y;
	
		elTitlebar.setPointerCapture(event.pointerId);

		elTitlebar.boundPointermoveTitlebar = this.onPointermoveTitlebar.bind(this)
		elTitlebar.addEventListener('pointermove', elTitlebar.boundPointermoveTitlebar);

		elTitlebar.boundPointerupTitlebar = this.onPointerupTitlebar.bind(this)
		elTitlebar.addEventListener('pointerup', elTitlebar.boundPointerupTitlebar);

		event.stopPropagation();
	}
	
	onPointermoveTitlebar(event) {
		var elTitlebar = event.target;
		var identifier = elTitlebar.id;
	
		// save the current mouse position
		var xy = this.normalizedMouseXY(event);
		var x = xy.x - elTitlebar.mouseOffsetX;
		var y = xy.y - elTitlebar.mouseOffsetY;
		
		if  (elTitlebar.className == 'chef-h1') 
			toolbar = elTitlebar.parentNode.parentNode;
		else
			toolbar = elTitlebar.parentNode.parentNode.parentNode;
			
		toolbar.style.left = x + 'px';
		toolbar.style.top = y + 'px';
		
		event.stopPropagation();
	}
	
	onPointerupTitlebar(event) {
		var elTitlebar = event.target;
	
		elTitlebar.releasePointerCapture(event.pointerId);
		elTitlebar.removeEventListener('pointermove', elTitlebar.boundPointermoveTitlebar);
		elTitlebar.removeEventListener('pointerup', elTitlebar.boundPointerupTitlebar);
		
		event.stopPropagation();
	}
	
	
	//^ The normalizedMouseXY returns the position of the mouse, at the time of the event,
	//  relative to document. This is cross-browser.
	normalizedMouseXY(event) {
		var x = 0;
		var y = 0;
	
		if (event.pageX && event.pageY)
		{
			x = event.pageX;
			y = event.pageY;
		}
		else if (event.clientX && event.clientY)
		{
			x = event.clientX + document.body.scrollLeft+ document.documentElement.scrollLeft;
			y = event.clientY + document.body.scrollTop	+ document.documentElement.scrollTop;
		}
	
		return {x:x, y:y}		
	}
	
	
	//^ The normalizedElementXY returns the X,Y position of the element, relative to the document,
	//  by walking up the tree of elements adding each parent's offset.
	//  This is cross-browser.
	normalizedElementXY(elem) {
		var x = 0;
		var y = 0;
	
		if (elem.offsetParent)
		{
			do {
				x += elem.offsetLeft;
				y += elem.offsetTop;
			} while (elem = elem.offsetParent);
		}
		return {x:x, y:y};	
	}
}

window.customElements.define(Static.componentName, RwtDockablePanels);
