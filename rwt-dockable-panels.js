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
	nextId:           1,
	TOPMOST_OPEN:     '☆',
	TOPMOST_CLOSED:   '★',
	EXPAND:           '+',
	COLLAPSE:         'x',
	FLOAT_RIGHT:      '>',
	FLOAT_LEFT:       '<',
	COLLAPSE_RIGHT:   '<',
	COLLAPSE_LEFT:    '>'
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
		this.nextZIndex = 2;
		this.nextFloatLeft = 0;

		// child elements
		this.toolbar = null;
		this.toolbarNav = null;
		this.toolbarTitlebar = null;
		this.toolbarExpandButton = null;
		
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

			this.style.touchAction = 'none';	// to prevent browser from canceling my touch events in order to perform automatic pan/zoom actions
			this.style.userSelect = 'none';		// to prevent android from popping up "COPY  SHARE  SELECT ALL" 
			
			this.identifyChildren();
			this.determineCorner();
			await this.getConfiguredPanels();
			this.determineInitialState();
			this.registerEventListeners();
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

	//^ Identify this component's children
	identifyChildren() {
		this.toolbar = this.shadowRoot.getElementById('toolbar');
		this.toolbar.isTopmostMenu = true;
		this.toolbar.isExpanded = true;
		this.toolbarNav = this.shadowRoot.getElementById('toolbar-nav');
		this.toolbarTitlebar = this.shadowRoot.getElementById('toolbar-titlebar');
		this.toolbarExpandButton = this.shadowRoot.getElementById('toolbar-expand-button');
	}		

	// bottom-left, bottom-right, top-left, top-right
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
		
		this.toolbar.className = `${this.corner} chef-toolbar`;		
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
	
	determineInitialState() {
		if (this.hasAttribute('open')) {
			this.openToolbar();
		}
		else if (this.hasAttribute('closed')) {
			this.closeToolbar();
		}
		else
			this.openToolbar();
	}
	
	registerEventListeners() {
		// component events
		this.shadowRoot.getElementById('toolbar-titlebar').addEventListener('pointerdown', this.onPointerdownToolbar.bind(this));
		this.shadowRoot.getElementById('toolbar-expand-button').addEventListener('click', this.onClickExpandButton.bind(this));
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
	//> options is an anonymous object having { titlebar, expandable, dockable, tabIndex, tooltip }
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
		//      <button id="panel-expand-button" class="chef-expand-button" type="button" tabindex="202">+</button>
		//      <button id="panel-float-button" class="chef-float-button" type="button" tabindex="203">~</button>
		//      <button id="panel-titlebar" class="chef-h2" tabindex="201">Position</button>
		//   </nav>
		
		var elNav = document.createElement('nav');
		elNav.id = `${panelId}-nav`;
		elNav.className = 'chef-nav';
		elPanel.appendChild(elNav);
	
		// these two control buttons are styled with a float and need to be above the h2 
		if (options.expandable) {
			var el = this.createTitlebarButton(elNav, `${panelId}-expand-button`, 'chef-expand-button', Static.EXPAND, 'Show more', options.tabIndex+2);
			el.isExpanded = false;
			el.addEventListener('click', this.onClickExpandButton.bind(this));
		}
		if (options.dockable) {
			var buttonChar = (this.corner == 'top-left' || this.corner == 'bottom-left') ? Static.FLOAT_RIGHT : Static.FLOAT_LEFT;
			var el = this.createTitlebarButton(elNav, `${panelId}-float-button`, 'chef-float-button', buttonChar, 'Detach menu', options.tabIndex+1);
			el.isDocked = true;
			el.addEventListener('click', this.onClickFloatButton.bind(this));
		}

		var elTitlebar = this.createTitlebarButton(elNav, `${panelId}-titlebar`, 'chef-h2', options.titlebar, options.tooltip, options.tabIndex+0);
		elTitlebar.isTopmostMenu = false;
		if (options.expandable == false || options.dockable == false)
			elTitlebar.style.width = 'var(--width-h1)';				
		if (options.expandable == false && options.dockable == false)
			elTitlebar.style.width = 'var(--width)';				

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

				case 'slider+input':
					this.appendSliderWithInput(elPanel, lineOptions);
					break;

				case 'generic':
					this.appendGenericArea(elPanel, lineOptions);
					break;
					
				case 'table':
					this.appendTableArea(elPanel, lineOptions);
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
	//    id is the identifier to be assigned to the <INPUT> being created
	//    labelText is the text to be displayed in the <LABEL> before the <INPUT>
	//    tooltip is the text to display on hover, optional
	//    widthInPx is a string value specifying the width of the input field, with a trailing 'px', optional
	//    textAfter is the optional short text to display after the INPUT, optional
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
			elInput.style.width = options.widthInPx;
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
	//^ The appendSliderWithInput function creates a line with a label and two INPUTs: a slider/input combo
	//> elPanel is the <MENU> created by appendPanel
	//> options has these properties { lineType, id, minValue, maxValue, tickmarks, labelText, tooltip, widthInPx, textAfter }
	//    id is the identifier to be assigned to the text <INPUT> being created (the range slider will append "-slider" to this id)

	//    curve is "callback", "linear" or "log"; defaults to linear if not defined
	//    fromSlider is a callback function that synchronizes <INPUT> value when the current slider position changes
	//    toSlider is a callback function that synchronizes the current slider position when the <INPUT> value changes
	//    fromUser
	//    toUser
	//    numDecimals
	
	//    minValue is the minimum acceptable "value" in user units; defaults to "" if not specified
	//    maxValue is the maximum acceptable "value" in user units; defaults to "" if not specified
	//    minPosition is the minimum slider position; defaults to 0 if not specified
	//    maxPosition is the maximum slider position; defaults to 100 if not specified
	//    stepPosition is the accuracy of the slider; defaults to 1 if not specified

	//    labelText is the text to be displayed in the <LABEL> before the two <INPUT>
	//    tooltip is the text to display on hover, optional
	//    widthInPx is a string value specifying the width of the input field, with a trailing 'px', optional
	//    textAfter is the optional short text to display after the INPUT, optional
	appendSliderWithInput(elPanel, options) {
		console.assert(options.lineType == 'slider+input');
		options.id = options.id || `id${Static.nextId++}`;
		options.labelText = options.labelText || '';
		options.textAfter = options.textAfter || '';
		var tooltip = (options.tooltip == undefined) ? '' : `title="${options.tooltip}"`;
		var width = (options.widthInPx == undefined) ? '' : `style='width: ${options.widthInPx}'`;
		var numDecimals = (options.numDecimals || 2);
		
		var minPosition = parseFloat(options.minPosition);
		if (isNaN(minPosition))
			minPosition = 0;
		var maxPosition = parseFloat(options.maxPosition);
		if (isNaN(maxPosition))
			maxPosition = 100;
		var stepPosition = parseFloat(options.stepPosition);
		if (isNaN(stepPosition))
			stepPosition = 1;

		var minValue = options.minValue != undefined ? parseFloat(options.minValue) : '';
		var maxValue = options.minValue != undefined ? parseFloat(options.maxValue) : '';
		
		var curve = options.curve || 'linear';
		
		// function to convert internal value to slider position
		var toSliderCallback = null;
		if (options.toSlider != undefined && options.toSlider.constructor.name == 'Function')
			toSliderCallback = options.toSlider;
		else if (curve == 'log')
			toSliderCallback = this.toSliderLogarithmic.bind(null, minPosition, maxPosition, minValue, maxValue);
		else // (curve == 'linear')
			toSliderCallback = this.toSliderLinear;
		
		// function to convert slider position to internal value
		var fromSliderCallback = null;
		if (options.fromSlider != undefined && options.fromSlider.constructor.name == 'Function')
			fromSliderCallback = options.fromSlider;
		else if (curve == 'log')
			fromSliderCallback = this.fromSliderLogarithmic.bind(null, minPosition, maxPosition, minValue, maxValue);
		else // (curve == 'linear')
			fromSliderCallback = this.fromSliderLinear;
		
		// function to convert internal value to user text
		var toUserCallback = null;
		if (options.toUser != undefined && options.toUser.constructor.name == 'Function')
			toUserCallback = options.toUser;
		else 
			toUserCallback = this.toUserFixedDecimal.bind(null, numDecimals, minValue, maxValue);
		
		// function to convert user text to internal value
		var fromUserCallback = null;
		if (options.fromUser != undefined && options.fromUser.constructor.name == 'Function')
			fromUserCallback = options.fromUser;
		else 
			fromUserCallback = this.fromUserFixedDecimal.bind(null, numDecimals, minValue, maxValue);
		
		var div1 = this.createLineWrapper(elPanel);
		div1.innerHTML = `
			<label id='${options.id}-label' class='chef-label'>${options.labelText}</label>
			<input id='${options.id}'       class='chef-input' type='text' ${tooltip} ${width}></input>
			<span  id='${options.id}-after' class='chef-after'>${options.textAfter}</span>`;

		var div2 = this.createLineWrapper(elPanel);
		div2.innerHTML = `<input id='${options.id}-slider' class='chef-slider' type='range' ${tooltip} min='${minPosition}' max='${maxPosition}' step='${stepPosition}'></input>`;
		
		// setup listeners to keep the two input elements in sync
		var elInput = this.shadowRoot.getElementById(`${options.id}`);
		var elSlider = this.shadowRoot.getElementById(`${options.id}-slider`);
		elInput.addEventListener('change', (event) => {
			var userText = elInput.value;
			var internalValue = fromUserCallback(userText);
			var sliderPosition = toSliderCallback(internalValue);
			var userText = toUserCallback(internalValue);  // this loopback reflects any min/max that was applied
			
			// refresh the visual of both elements
			elInput.value = userText;
			elSlider.value = sliderPosition;
		});
		elSlider.addEventListener('input', (event) => {
			var sliderPosition = parseFloat(elSlider.value);
			var internalValue = fromSliderCallback(sliderPosition);
			var userText = toUserCallback(internalValue);
			
			// only the user input needs a visual refresh
			elInput.value = userText;
		});
	}

	fromSliderLinear(sliderPosition) {
		var internalValue = sliderPosition;
		return internalValue;
	}
	
	// convert linear slider position to logarithmic value for configs with 'log' curve
	fromSliderLogarithmic(minPosition, maxPosition, minValue, maxValue, sliderPosition) {
		var minValue = Math.log(minValue);
		var maxValue = Math.log(maxValue);
		var scale = (maxValue - minValue) / (maxPosition - minPosition);
		var internalValue = Math.exp(minValue + scale*(sliderPosition - minPosition));
		return internalValue;
	}
	
	toSliderLinear(internalValue) {
		var sliderPosition = internalValue;
		return sliderPosition;
	}
	
	// convert logarithmic value to linear slider position for configs with 'log' curve
	toSliderLogarithmic(minPosition, maxPosition, minValue, maxValue, internalValue) {
		var minValue = Math.log(minValue);
		var maxValue = Math.log(maxValue);
		var scale = (maxValue - minValue) / (maxPosition - minPosition);
		var sliderPosition = (Math.log(internalValue) - minValue) / scale + minPosition;
		return sliderPosition;
	}
	
	// convert from internal value to user text with fixed number of decimal points
	toUserFixedDecimal(numDecimals, minValue, maxValue, internalValue) {
		var userText = parseFloat(internalValue).toFixed(numDecimals);
		return userText;
	}
	
	// convert from user text to floating point or integer internal value
	// numDecimals is a bound value, the others are the standard signature args
	fromUserFixedDecimal(numDecimals, minValue, maxValue, userText) {
		
		var internalValue = (numDecimals == 0) ? parseInt(userText) : parseFloat(userText);
		
		// enforce min/max from user, if the configuration has provided for it
		if (minValue != '' && maxValue != '') {
			if (isNaN(internalValue))
				internalValue = minValue;
			if (internalValue < minValue)
				internalValue = minValue;
			if (internalValue > maxValue)
				internalValue = maxValue;			
		}
		else {
			if (isNaN(internalValue))
				return undefined;
		}

		// fixed number of decimals
		if (numDecimals > 0) {
			var str = internalValue.toFixed(numDecimals);
			internalValue = parseFloat(str);
		}
		return internalValue;
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

	//^ The appendTableArea function creates a <table> suitable for use with dynamic HTML
	//> id is the identifier to be assigned to the <TABLE> being created
	//> innerHTML is the HTML to start with 
	//> minHeightInPx is a number of pixels, expressed as a string ending in 'px', like '156px'
	//> maxHeightInPx is a number of pixels, expressed as a string ending in 'px', like '156px'
	//< returns the <TABLE> element created by this function
	appendTableArea(elPanel, options)
	{
		console.assert(options.lineType == 'table');
		options.id = options.id || `id${Static.nextId++}`;
		options.innerHTML = options.innerHTML || '';
		
		var div = this.createLineWrapper(elPanel);
		div.style.padding = '0';
		div.style.height = '100%';
		if (options.minHeightInPx) {
			div.style.minHeight = options.minHeightInPx;
		}
		if (options.maxHeightInPx) {
			div.style.overflowY = 'auto';
			div.style.maxHeight = options.maxHeightInPx;
		}
		
		var elTable = document.createElement('table');
		elTable.id = options.id;
		elTable.className = 'chef-table';
		elTable.style.width = '100%';
		elTable.innerHTML = options.innerHTML;
		div.appendChild(elTable);
		
		return elTable;
	}	

	//-------------------------------------------------------------------------
	// Helpers
	//-------------------------------------------------------------------------
	
	//^ The createTitlebarButton function is a private function for adding +/-  or ~/^ buttons or the titlebar text
	//> nav is the <NAV> parent element
	//> buttonId is the new button's identifier
	//> classname is either 'chef-expand-button' or 'chef-float-button'
	//> elementText is the single character to use with the button  + - < > 
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
		
	getMenuElement(menuID) {
		return this.shadowRoot.getElementById(menuID);
	}
	
	getExpandButton(menuID) {
		return this.shadowRoot.getElementById(menuID + '-expand-button');
	}
	
	getFloatButton(menuID) {
		return this.shadowRoot.getElementById(menuID + '-float-button');
	}
	
	getTitlebar(menuID) {
		return this.shadowRoot.getElementById(menuID + '-titlebar');
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
	
	// programmatic method to open the toolbar, showing all the panels in their current expand/collapse state
	openToolbar() {
		this.expandCollapseHelper(this.toolbar, this.toolbarExpandButton, 'expand');
	}
	
	// programmatic method to close the toolbar, leaving only the Star button
	closeToolbar() {
		this.expandCollapseHelper(this.toolbar, this.toolbarExpandButton, 'collapse');
	}
	
	// programmatic method to expand a panel, showing all its lines
	expandPanel(menuID) {
		var menu = this.getMenuElement(menuID);
		var button = this.getExpandButton(menuID);
		
		if (menu && button)
			this.expandCollapseHelper(menu, button, 'expand');
	}
	
	// programmatic method to collapse a panel, showing only its titlebar
	collapsePanel(menuID) {
		var menu = this.getMenuElement(menuID);
		var button = this.getExpandButton(menuID);
		
		if (menu && button)
			this.expandCollapseHelper(menu, button, 'collapse');
	}
	
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
		this.expandCollapseHelper(menu, button, expandCollapse);
	
		event.stopPropagation();
	}	
	
	//^ The expandCollapseHelper  function
	//> menu is the parent <MENU> element
	//> nav is the inner <NAV> element
	//> button is the clickable <BUTTON> element
	//> expandCollapse is 'expand' or 'collapse'
	expandCollapseHelper(menu, button, expandCollapse) {
		
		// show/hide all the lines
		for (var i = 0; i < menu.children.length; i++) {
			var child = menu.children[i];
			if ((menu.isTopmostMenu && (child.className == 'chef-list' || child.className == 'chef-menuitem')) ||
			    (!menu.isTopmostMenu && (child.className == 'chef-line')))
			   		child.style.display = (expandCollapse == 'expand') ? 'block' : 'none';
		}
	
		// if this is the topmost, hide the label too
		if (menu.isTopmostMenu) {
			this.toolbarTitlebar.style.display = (expandCollapse == 'expand') ? 'block' : 'none';
			menu.style.width = (expandCollapse == 'expand') ? 'var(--width)' : '24px';
		}
		
		if (menu.isTopmostMenu)
			button.innerHTML = (expandCollapse == 'expand') ? Static.TOPMOST_OPEN : Static.TOPMOST_CLOSED;
		else
			button.innerHTML = (expandCollapse == 'expand') ? Static.COLLAPSE : Static.EXPAND;
		
		if (menu.isTopmostMenu)
			button.title = (expandCollapse == 'expand') ? 'Close' : 'Open';
		else
			button.title = (expandCollapse == 'expand') ? 'Show less' : 'Show more';
			
		menu.isExpanded = (expandCollapse == 'expand') ? true : false;
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
	
	// programmatic method to detach a panel from the toolbar
	detachPanel(menuID) {
		var menu = this.getMenuElement(menuID);
		var button = this.getFloatButton(menuID);
		
		if (menu && button)
			this.floatDockHelper(menu, button, 'float');
	}
	
	// programmatic method to reattach a panel to the toolbar
	attachPanel(menuID) {
		var menu = this.getMenuElement(menuID);
		var button = this.getFloatButton(menuID);
		
		if (menu && button)
			this.floatDockHelper(menu, button, 'dock');
	}
	
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
		this.floatDockHelper(menu, button, dockedFloated);
		
		event.stopPropagation();
	}
		
	//^ gets a small X offset for a menu that is being floated,
	//  so that it is not directly on top of the previously floated menu.
	nextFloatDeltaX() {
		this.nextFloatLeft = (this.nextFloatLeft > 100) ? 0 : this.nextFloatLeft+10;
		return this.nextFloatLeft;
	}
	
	//^ The floatDockHelper function
	//> menu is the parent <MENU> element
	//> button is the clickable <BUTTON> element
	//> dockedFloated is 'float' or 'dock'
	 floatDockHelper(menu, button, dockedFloated) {
		 if (dockedFloated == 'float')
		 {
			 if (menu.isDocked == false)
				 return;
			 
			// create a placeholder for redocking and insert it just before the menu being floated
			var placeholderNode = document.createElement('div');
			placeholderNode.style.display = 'none';
			menu.parentNode.insertBefore(placeholderNode, menu);
			menu.saveReferenceNode = placeholderNode;
			menu.saveParentNode = menu.parentNode;
	
			// create toolbar, append toolbar to shadow root, append menu to toolbar
			var floatParentNode = document.createElement('menu');
			floatParentNode.className = 'chef-toolbar';

			// enable dragging
			menu.boundPointerdownToolbar = this.onPointerdownToolbar.bind(this);
			menu.addEventListener('pointerdown', menu.boundPointerdownToolbar);
			
			// prepare to use the previous position of the menu, when it was last floating, if available
			var pp = menu.savePosition;
			var bHasPosition = (pp != undefined) ? true : false;
			
			// otherwise, prepare to place the floating parent just left or right of the submenu's docked position
			var gutter = 13;
			var delta = this.nextFloatDeltaX();
			
			if (this.corner == 'top-left' || this.corner == 'bottom-left') {
				if (!bHasPosition) {
					var x = (menu.offsetLeft + menu.offsetParent.offsetLeft) + menu.offsetWidth + gutter + delta;
					floatParentNode.style.left = x + 'px';
				}
				else
					floatParentNode.style.left = pp.left;
			}
			else {  // (this.corner == 'top-right' || this.corner == 'bottom-right')
				if (!bHasPosition) {
					var toolbarRight = this.pxToNum(window.getComputedStyle(this.toolbar).getPropertyValue('right'));
					var toolbarWidth = this.toolbar.offsetWidth;
					var x = toolbarRight + toolbarWidth + gutter + delta;
					floatParentNode.style.right = x + 'px';
				}
				else
					floatParentNode.style.right = pp.right;
			}
			
			if (this.corner == 'top-left' || this.corner == 'top-right') {
				if (!bHasPosition) {
					var y = menu.offsetTop + menu.offsetParent.offsetTop;
					floatParentNode.style.top = y + 'px';
				}
				else
					floatParentNode.style.top = pp.top;
			}
			else { // (this.corner == 'bottom-left' || this.corner == 'bottom-right')
				if (!bHasPosition) {
					var toolbarBottom = this.pxToNum(window.getComputedStyle(this.toolbar).getPropertyValue('bottom'));
					var toolbarHeight = this.toolbar.offsetHeight;
					var y = toolbarBottom + toolbarHeight - menu.offsetTop - menu.offsetHeight;
					floatParentNode.style.bottom = y + 'px';
				}
				else
					floatParentNode.style.bottom = pp.bottom;
			}
			this.shadowRoot.appendChild(floatParentNode);
			
			// move the submenu to the new floating parent
			floatParentNode.appendChild(menu);

			button.innerHTML = (this.corner == 'top-left' || this.corner == 'bottom-left') ? Static.COLLAPSE_RIGHT : Static.COLLAPSE_LEFT;
			button.title = 'Dock menu';
			menu.isDocked = false;
			
			// newly floated panels should be expanded automatically, and placed on top
			this.expandPanel(menu.id);
			menu.style.zIndex = this.nextZIndex++;
		}
		
		else // (dockedFloated == 'dock')
		{
			if (menu.isDocked == true)
				return;
			
			var floatParentNode = menu.parentNode;
			
			menu.savePosition = {};
			menu.savePosition.left = floatParentNode.style.left;
			menu.savePosition.right = floatParentNode.style.right;
			menu.savePosition.top = floatParentNode.style.top;
			menu.savePosition.bottom = floatParentNode.style.bottom;
			
			menu.saveParentNode.insertBefore(menu, menu.saveReferenceNode);
			menu.saveParentNode.removeChild(menu.saveReferenceNode);
			floatParentNode.parentNode.removeChild(floatParentNode);
			
			// disable dragging
			menu.removeEventListener('pointerdown', menu.boundPointerdownToolbar);
			
			// if the toolbar is collapsed, hide the panel's elements
			if (!menu.saveParentNode.isExpanded)
				menu.style.display = 'none';
			
			button.innerHTML = (this.corner == 'top-left' || this.corner == 'bottom-left') ? Static.FLOAT_RIGHT : Static.FLOAT_LEFT;
			button.title = 'Detach menu';
			menu.isDocked = true;
			
			// newly docked panels should be collapsed automatically
			this.collapsePanel(menu.id);
		}
	}

	 //-------------------------------------------------------------------------
	// Dragging toolbar menus
	//-------------------------------------------------------------------------
	
	onPointerdownToolbar(event) {
		if (event.target.className == 'chef-expand-button' || event.target.className == 'chef-float-button')
			return;
			
		var element = event.target;
		var toolbarMenu = null;
		
		while (toolbarMenu == null) {
			if (element.className.indexOf('chef-toolbar') != -1) {
				toolbarMenu = element;
			}
			else if (element.className.indexOf('chef-line') != -1) {
				return;
			}
			else {
				if (element.parentNode.nodeName == '#document-fragment')
					return;
				element = element.parentNode;
			}
		}

		if (this.corner == 'top-left' || this.corner == 'bottom-left')
			toolbarMenu.startingElementX = toolbarMenu.offsetLeft;
		else  // (this.corner == 'top-right' || this.corner == 'bottom-right')
			toolbarMenu.startingElementX =  this.pxToNum(window.getComputedStyle(toolbarMenu).getPropertyValue('right'));
				
		if (this.corner == 'top-left' || this.corner == 'top-right')
			toolbarMenu.startingElementY = toolbarMenu.offsetTop;
		else // (this.corner == 'bottom-left' || this.corner == 'bottom-right')
			toolbarMenu.startingElementY =  this.pxToNum(window.getComputedStyle(toolbarMenu).getPropertyValue('bottom'));

		toolbarMenu.startingMouseX = event.pageX;
		toolbarMenu.startingMouseY = event.pageY;

		toolbarMenu.boundPointermoveToolbar = this.onPointermoveToolbar.bind(this);
		toolbarMenu.addEventListener('pointermove', toolbarMenu.boundPointermoveToolbar);

		toolbarMenu.boundPointerupToolbar = this.onPointerupToolbar.bind(this);
		toolbarMenu.addEventListener('pointerup', toolbarMenu.boundPointerupToolbar);

		toolbarMenu.style.zIndex = this.nextZIndex++;
		toolbarMenu.setPointerCapture(event.pointerId);
		
		event.stopPropagation();
	}
	
	onPointermoveToolbar(event) {
		var toolbarMenu = event.currentTarget;

		if (this.corner == 'top-left') {
			var newY = toolbarMenu.startingElementY - (toolbarMenu.startingMouseY - event.pageY);
			var newX = toolbarMenu.startingElementX - (toolbarMenu.startingMouseX - event.pageX);
			toolbarMenu.style.top = newY + 'px';
			toolbarMenu.style.left = newX + 'px';
		}
		else if (this.corner == 'bottom-left') {
			var newY = toolbarMenu.startingElementY + (toolbarMenu.startingMouseY - event.pageY);
			var newX = toolbarMenu.startingElementX - (toolbarMenu.startingMouseX - event.pageX);
			toolbarMenu.style.bottom = newY + 'px';
			toolbarMenu.style.left = newX + 'px';
		}
		else if (this.corner == 'top-right') {
			var newY = toolbarMenu.startingElementY - (toolbarMenu.startingMouseY - event.pageY);
			var newX = toolbarMenu.startingElementX + (toolbarMenu.startingMouseX - event.pageX);
			toolbarMenu.style.top = newY + 'px';
			toolbarMenu.style.right = newX + 'px';
		}
		else if (this.corner == 'bottom-right') {
			var newY = toolbarMenu.startingElementY + (toolbarMenu.startingMouseY - event.pageY);
			var newX = toolbarMenu.startingElementX + (toolbarMenu.startingMouseX - event.pageX);
			toolbarMenu.style.bottom = newY + 'px';
			toolbarMenu.style.right = newX + 'px';
		}
		else {
			console.error(`unrecognized corner ${this.corner}`);
		}
	
		event.stopPropagation();
	}
	
	onPointerupToolbar(event) {
		var toolbarMenu = event.currentTarget;
	
		toolbarMenu.releasePointerCapture(event.pointerId);
		toolbarMenu.removeEventListener('pointermove', toolbarMenu.boundPointermoveToolbar);
		toolbarMenu.removeEventListener('pointerup', toolbarMenu.boundPointerupToolbar);
		
		event.stopPropagation();
	}
	
	pxToNum(string) {
		var pos = string.indexOf('px');
		if (pos != -1)
			string = string.substr(0,pos);
		return parseInt(string);
	}
}

window.customElements.define(Static.componentName, RwtDockablePanels);
