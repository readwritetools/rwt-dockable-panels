












<figure>
	<img src='/img/components/dockable-panels/dockable-panels-1500x750.jpg' width='100%' />
	<figcaption></figcaption>
</figure>

##### Premium DOM Component

# Dockable Panels

## Expand, collapse, dock and float


<address>
<img src='/img/48x48/rwtools.png' /> by <a href='https://readwritetools.com' title='Read Write Tools'>Read Write Tools</a> <time datetime=2020-11-05>Nov 5, 2020</time></address>



<table>
	<tr><th>Abstract</th></tr>
	<tr><td>The <span class=product>rwt-dockable-panels</span> DOM component is an accordion-style component with panels that expand/collapse and dock/float.</td></tr>
</table>

### Motivation

Some apps have lots of interactive manipulations for working with a canvas or
object. Putting the tools and options for these manipulation commands within
menus is a weak design pattern. The use of floatable, dockable, and collapsable
panels is a better alternative because it lets the user initiate commands with
shorter mouse transit times and fewer clicks. It also provides the user with a
personalized mental map of where the commands can be initiated, something that a
hierarchical menu doesn't do well.

The component has these features:

   * The component comprises a collection of panels that contain logically related
      information.
   * Each panel has a titlebar for self-identification and a panel area comprising
      DOM elements.
   * The titlebar has an expand/collapse button which allows the panel's elements to
      be shown or hidden.
   * The titlebar has a float/dock button which allows the panel to be
      detached/attached from the main panel.
   * Floating panels can be moved with the mouse by dragging the titlebar.
   * The initial position of the menu is relative to any one of the four viewport
      corners.

#### In the wild

To see an example of this component in use, visit the <a href='https://simply.earth'>simply.earth</a>
website. It uses this component for its Tangent, Scale, Rotate, Locate, and
Identify panels. To understand what's going on under the hood, use the browser's
inspector to view the HTML source code and network activity, and follow along as
you read this documentation.

### Installation

#### Prerequisites

The <span>rwt-dockable-panels</span> DOM component works in any
browser that supports modern W3C standards. Templates are written using <span>
BLUE</span><span>PHRASE</span> notation, which can be compiled into HTML using the
free <a href='https://hub.readwritetools.com/desktop/rwview.blue'>Read Write View</a>
desktop app. It has no other prerequisites. Distribution and installation are
done with either NPM or via Github.

#### Download


<details>
	<summary>Download using NPM</summary>
	<p><b>OPTION 1:</b> Familiar with Node.js and the <code>package.json</code> file?<br />Great. Install the component with this command:</p>
	<pre lang=bash>
npm install rwt-dockable-panels<br />	</pre>
	<p><b>OPTION 2:</b> No prior experience using NPM?<br />Just follow these general steps:</p>
	<ul>
		<li>Install <a href='https://nodejs.org'>Node.js/NPM</a> on your development computer.</li>
		<li>Create a <code>package.json</code> file in the root of your web project using the command:</li>
		<pre lang=bash>
npm init<br />		</pre>
		<li>Download and install the DOM component using the command:</li>
		<pre lang=bash>
npm install rwt-dockable-panels<br />		</pre>
	</ul>
	<p style='font-size:0.9em'>Important note: This DOM component uses Node.js and NPM and <code>package.json</code> as a convenient <i>distribution and installation</i> mechanism. The DOM component itself does not need them.</p>
</details>


<details>
	<summary>Download using Github</summary>
	<p>If you prefer using Github directly, simply follow these steps:</p>
	<ul>
		<li>Create a <code>node_modules</code> directory in the root of your web project.</li>
		<li>Clone the <span class=product>rwt-dockable-panels</span> DOM component into it using the command:</li>
		<pre lang=bash>
git clone https://github.com/readwritetools/rwt-dockable-panels.git<br />		</pre>
	</ul>
</details>

### Using the DOM component

After installation, you need to add two things to your HTML page to make use of
it:

   1. Add a `script` tag to load the component's `rwt-dockable-panels.js` file:
```html
<script src='/node_modules/rwt-dockable-panels/rwt-dockable-panels.js' type=module></script>             
```

   2. Add the component tag somewhere on the page.

      * For scripting purposes, apply an `id` attribute.
      * For WAI-ARIA accessibility apply a `role=contentinfo` attribute.
      * Apply a `corner` attribute with one of these values

         * top-left
         * top-right
         * bottom-left
         * bottom-right
      * Apply a `sourceref` attribute with a reference to a JSON file containing the panel
         configuration. (Or optionally use the programmatic interface for panel
         configuration.)
      * Optionally, apply an `open` or `closed` attribute to set the initial state of the
         toolbar
```html
<rwt-dockable-panels id=toolbarId sourceref='/panels.json' corner=top-right role=contentinfo open></rwt-dockable-panels>
```


#### Panel configuration

The panels can be configured programmatically or through a JSON file. Both
accept similar objects.

#### JSON file configuration

A JSON file containing a collection of panel configurations can be specified as
an attribute of the component. Do this with HTML like `<rwt-dockable-panels sourceref='panels.json'></rwt-dockable-panels>`
The JSON object should contain an object with two properties:

   1. `toolbar` an object for configuring the entire component, having:

      * `titlebar` the plain text or HTML to use for the main menu.
   2. `panels` an array of panel objects for configuring the panels, having:

      * `options` an object to configure each panel's basic properties;

         * `id` the HTML identifier for the panel
         * `titlebar` the text title for the panel
         * `tabIndex` the HTML tabIndex, optional
         * `tooltip` the fly-over popup title for the panel, optional
      * `panelLines` an array of line objects to configure the elements of the panel, line
         by line.

         * `lineType` specifies what to put on the line, see below
         * `id` the HTML identifier for the line's principal element, see below

These are the possible lineTypes and their configuration properties:

   1. `"input"`

      * `labelText` the text to place before the INPUT element
      * `id` the identifier for the INPUT element
      * `textAfter` any text to place after the INPUT element, optional
      * `tooltip` the fly-over popup title for the INPUT element, optional
   2. `"dropdown"`

      * `labelText` the text to place before the SELECT element
      * `id` the identifier for the SELECT element
      * `tooltip` the fly-over popup title for the SELECT element, optional
      * `selections` an array of OPTIONS, specified as objects, each having:

         * `v` the OPTION value
         * `t` the OPTION text
   3. `"button"`

      * `buttonText` the text to place on the BUTTON element
      * `id` the identifier for the BUTTON element
      * `tooltip` the fly-over popup title for the BUTTON element, optional
   4. `"multi-button"`

      * `buttons` an array of objects to define each button, having:

         * `buttonText` the text to place on the BUTTON element
         * `id` the identifier for the BUTTON element
         * `tooltip` the fly-over popup title for the BUTTON element, optional
   5. `"generic"`

      * `id` the identifier for the DIV element
      * `heightInPx` the height of the DIV element, specified with "px"
      * `overflowY` Whether to show the scrollbar, either "scroll" or "hidden"

#### Programmatic configuration

The component has methods to programmatically configure panels. They use objects
with the same properties as just described. The methods are:


<dl>
	<dt>setTitlebar (html)</dt>
	<dd>sets the topmost menu titlebar</dd>
	<dt>appendPanel (panelId, options, panelLines)</dt>
	<dd>creates a new panel and adds it to the component</dd>
	<dt>appendInputLine (elPanel, options)</dt>
	<dd>creates a line with a label and an input</dd>
	<dt>appendDropdown (elPanel, options)</dt>
	<dd>creates a line with a label and a select element</dd>
	<dt>appendSingleButton (elPanel, options)</dt>
	<dd>creates an internal button for doing something user-defined</dd>
	<dt>appendMultiButtons (elPanel, options)</dt>
	<dd>creates multiple buttons that logically work together and visually appear on one line</dd>
	<dt>appendGenericArea (elPanel, options)</dt>
	<dd>creates a div suitable for use with dynamic HTML</dd>
</dl>

#### Programmatic manipulation

The component also has methods to programmatically manipulate the toolbar and
its panels.


<dl>
	<dt>openToolbar ()</dt>
	<dd>shows all the panels in their current expand/collapse state</dd>
	<dt>closeToolbar ()</dt>
	<dd>leaves only the Star button visible</dd>
	<dt>expandPanel (menuID)</dt>
	<dd>shows all of the panel's lines</dd>
	<dt>collapsePanel (menuID)</dt>
	<dd>shows only the panel's titlebar</dd>
	<dt>detachPanel (menuID)</dt>
	<dd>detaches the panel from the toolbar, allowing it to float independently</dd>
	<dt>attachPanel (menuID)</dt>
	<dd>reattaches the panel to the toolbar</dd>
</dl>

### Customization

#### Initial position

Initially the toolbar is positioned a certain distance from one of the
viewport's corners, specified using the `corner` attribute and two of these offset
variables.

```css
rwt-dockable-panels {
    --top: 30px;
    --bottom: 30px;
    --left: 30px;
    --right: 30px;
    --z-index: 1;
}
```

#### Visuals and color scheme

The font for the component can be changed with the `--font-family` variable.

The width of the component can be set with the `--width` variable.

The default color palette for the menu uses a dark mode theme. You can use CSS
to override the variables' defaults:

```css
rwt-dockable-panels {
    --color: var(--pure-white);
    --border-color: var(--pure-white);
    --background-color1: var(--surfie-green);
    --background-color2: var(--coral-atoll);
    --background-color3: var(--tiber);
    --background-color4: var(--eden);
}
```

### Life-cycle events

The component issues life-cycle events.


<dl>
	<dt><code>component-loaded</code></dt>
	<dd>Sent when the component is fully loaded and ready to be used. As a convenience you can use the <code>waitOnLoading()</code> method which returns a promise that resolves when the <code>component-loaded</code> event is received. Call this asynchronously with <code>await</code>.</dd>
</dl>

---

### Reference


<table>
	<tr><td><img src='/img/48x48/read-write-hub.png' alt='DOM components logo' width=48 /></td>	<td>Documentation</td> 		<td><a href='https://hub.readwritetools.com/components/dockable-panels.blue'>READ WRITE HUB</a></td></tr>
	<tr><td><img src='/img/48x48/git.png' alt='git logo' width=48 /></td>	<td>Source code</td> 			<td><a href='https://github.com/readwritetools/rwt-dockable-panels'>github</a></td></tr>
	<tr><td><img src='/img/48x48/dom-components.png' alt='DOM components logo' width=48 /></td>	<td>Component catalog</td> 	<td><a href='https://domcomponents.com/components/dockable-panels.blue'>DOM COMPONENTS</a></td></tr>
	<tr><td><img src='/img/48x48/npm.png' alt='npm logo' width=48 /></td>	<td>Package installation</td> <td><a href='https://www.npmjs.com/package/rwt-dockable-panels'>npm</a></td></tr>
	<tr><td><img src='/img/48x48/read-write-stack.png' alt='Read Write Stack logo' width=48 /></td>	<td>Publication venue</td>	<td><a href='https://readwritestack.com/components/dockable-panels.blue'>READ WRITE STACK</a></td></tr>
</table>

### License

The <span>rwt-dockable-panels</span> DOM component is not
freeware. After evaluating it and before using it in a public-facing website,
eBook, mobile app, or desktop application, you must obtain a license from <a href='https://readwritetools.com/licensing.blue'>Read Write Tools</a>
.

<img src='/img/blue-seal-premium-software.png' width=80 align=right />

<details>
	<summary>Dockable Panels Software License Agreement</summary>
	<ol>
		<li>This Software License Agreement ("Agreement") is a legal contract between you and Read Write Tools ("RWT"). The "Materials" subject to this Agreement include the "Dockable Panels" software and associated documentation.</li>
		<li>By using these Materials, you agree to abide by the terms and conditions of this Agreement.</li>
		<li>The Materials are protected by United States copyright law, and international treaties on intellectual property rights. The Materials are licensed, not sold to you, and can only be used in accordance with the terms of this Agreement. RWT is and remains the owner of all titles, rights and interests in the Materials, and RWT reserves all rights not specifically granted under this Agreement.</li>
		<li>Subject to the terms of this Agreement, RWT hereby grants to you a limited, non-exclusive license to use the Materials subject to the following conditions:</li>
		<ul>
			<li>You may not distribute, publish, sub-license, sell, rent, or lease the Materials.</li>
			<li>You may not decompile or reverse engineer any source code included in the software.</li>
			<li>You may not modify or extend any source code included in the software.</li>
			<li>Your license to use the software is limited to the purpose for which it was originally intended, and does not include permission to extract, link to, or use parts on a separate basis.</li>
		</ul>
		<li>Each paid license allows use of the Materials under one "Fair Use Setting". Separate usage requires the purchase of a separate license. Fair Use Settings include, but are not limited to: eBooks, mobile apps, desktop applications and websites. The determination of a Fair Use Setting is made at the sole discretion of RWT. For example, and not by way of limitation, a Fair Use Setting may be one of these:</li>
		<ul>
			<li>An eBook published under a single title and author.</li>
			<li>A mobile app for distribution under a single app name.</li>
			<li>A desktop application published under a single application name.</li>
			<li>A website published under a single domain name. For this purpose, and by way of example, the domain names "alpha.example.com" and "beta.example.com" are considered to be separate websites.</li>
			<li>A load-balanced collection of web servers, used to provide access to a single website under a single domain name.</li>
		</ul>
		<li>THE MATERIALS ARE PROVIDED BY READ WRITE TOOLS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL READ WRITE TOOLS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.</li>
		<li>This license is effective for a one year period from the date of purchase or until terminated by you or Read Write Tools. Continued use, publication, or distribution of the Materials after the one year period, under any of this Agreement's Fair Use Settings, is subject to the renewal of this license.</li>
		<li>Products or services that you sell to third parties, during the valid license period of this Agreement and in compliance with the Fair Use Settings provision, may continue to be used by third parties after the effective period of your license.</li>
		<li>If you decide not to renew this license, you must remove the software from any eBook, mobile app, desktop application, web page or other product or service where it is being used.</li>
		<li>Without prejudice to any other rights, RWT may terminate your right to use the Materials if you fail to comply with the terms of this Agreement. In such event, you shall uninstall and delete all copies of the Materials.</li>
		<li>This Agreement is governed by and interpreted in accordance with the laws of the State of California. If for any reason a court of competent jurisdiction finds any provision of the Agreement to be unenforceable, that provision will be enforced to the maximum extent possible to effectuate the intent of the parties and the remainder of the Agreement shall continue in full force and effect.</li>
	</ol>
</details>

#### Activation

To activate your license, copy the `rwt-registration-keys.js` file to the *root
directory of your website*, providing the `customer-number` and `access-key` sent to
your email address, and replacing `example.com` with your website's hostname.
Follow this example:

<pre>
export default [{
    "product-key": "rwt-dockable-panels",
    "registration": "example.com",
    "customer-number": "CN-xxx-yyyyy",
    "access-key": "AK-xxx-yyyyy"
}]
</pre>

