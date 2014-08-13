/* Menu
 ================================================================================ */
/**
 * The Menu component is used to build pop up menus, including subtitle and
 * captions selection menus.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
vjs.Menu = vjs.Component.extend({
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        var touchstart = false;
        this.on('touchstart', function(event) {
            // Stop click and other mouse events from triggering also
            event.preventDefault();
            touchstart = true;
        });
        this.on('touchmove', function() {
            touchstart = false;
        });
        var self = this;
        this.on('touchend', function(event) {
            if (touchstart) {
                self.onClick(event);
            }
            event.preventDefault();
        });

        this.on('click', this.onClick);
        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
    }
});

// Focus - Add keyboard functionality to element
vjs.Menu.prototype.onFocus = function(){
   // vjs.on(document, 'keyup', vjs.bind(this, this.onKeyPress));
    vjs.on(document, 'keydown', vjs.bind(this, this.onKeyPress));
};

// KeyPress (document level) - Trigger click when keys are pressed
vjs.Menu.prototype.onKeyPress = function(event){
    // Check for space bar (32) or enter (13) keys
    if (event.which == 32 || event.which == 13){
        event.preventDefault();
        this.onClick();
    }
};

// Blur - Remove keyboard triggers
vjs.Menu.prototype.onBlur = function(){
    vjs.off(document, 'keyup', vjs.bind(this, this.onKeyPress));
};
vjs.Menu.prototype.onClick = function(){
};
/**
 * Add a menu item to the menu
 * @param {Object|String} component Component or component type to add
 */
vjs.Menu.prototype.addItem = function(component){
    this.addChild(component);
    component.on('click', vjs.bind(this, function(){
        this.unlockShowing();
    }));
};

/** @inheritDoc */
vjs.Menu.prototype.createEl = function(){
    var contentElType = this.options().contentElType || 'ul';
    this.contentEl_ = vjs.createEl(contentElType,{
        className: 'vjs-menu-content',
        'role': 'menu'
    });
  var el = vjs.Component.prototype.createEl.call(this, 'div', {
        append: this.contentEl_,
        className: 'vjs-menu'
   });
    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Menu Buttons,
    // where a click on the parent is significant
    vjs.on(el, 'click', function(event){
        event.preventDefault();
        event.stopImmediatePropagation();
    });

    return el;
};

/**
 * The component for a menu item. `<li>`
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
vjs.MenuItem = vjs.Menu.extend({
    /** @constructor */
    init: function(player, options) {
        vjs.Menu.call(this, player, options);
        this.selected(options['selected']);
    }
});
/** @inheritDoc */
var MenuItemId_Captions =0,MenuItemId_Subtitles=0;  // global id for menu items
vjs.MenuItem.prototype.createEl = function(type, props){
    var item_id;
    if(this.track.kind()=='captions'){
        item_id = 'vjs_Caption_'+MenuItemId_Captions++;
    }
    else if(this.track.kind()=='subtitles'){
        item_id = 'vjs_Subtitle_'+MenuItemId_Subtitles++;
    }
    props = vjs.obj.merge({
        id: item_id,      // id for menu item
        className: this.buildCSSClass(),
        innerHTML: this.options_['label'],
        'role': 'menuitem',
        tabIndex: -1
    }, props);
    type = 'li';

    return vjs.Component.prototype.createEl.call(this, type, props);
};

vjs.MenuItem.prototype.buildCSSClass = function(){
    return 'vjs-menu-item ';
};

/**
 * Handle a click on the menu item, and set it to selected
 */
vjs.MenuItem.prototype.onClick = function(){
    this.selected(true);
};

/**
 * Set this menu item as selected or not
 * @param  {Boolean} selected
 */
vjs.MenuItem.prototype.selected = function(selected){
  if (selected) {
        this.addClass('vjs-selected');
        this.el_.setAttribute('aria-checked',true);
    } else {
        this.removeClass('vjs-selected');
        this.el_.setAttribute('aria-checked',false);
    }
};

/**
 * A button class with a popup menu
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.MenuButton = vjs.Button.extend({
    /** @constructor */
  init: function(player, options){
        vjs.Button.call(this, player, options);

        this.menu = this.createMenu();

        // Add list to element
        this.addChild(this.menu);

        // Automatically hide empty menu buttons
        if (this.items && this.items.length === 0) {
            this.hide();
        }

        this.on('keyup', this.onKeyPress);
        this.el_.setAttribute('aria-haspopup', true);
        this.el_.setAttribute('role', 'button');
    }
});

/**
 * Track the state of the menu button
 * @type {Boolean}
 * @private
 */
vjs.MenuButton.prototype.buttonPressed_ = false;

vjs.MenuButton.prototype.createMenu = function(){
    var menu = new vjs.Menu(this.player_);

    // Add a title list item to the top
    if (this.options().title) {
        menu.el().appendChild(vjs.createEl('li', {
            className: 'vjs-menu-title',
            innerHTML: vjs.capitalize(this.kind_),
            tabindex: -1
        }));
    }

    this.items = this['createItems']();

    if (this.items) {
        // Add menu items to the menu
        for (var i = 0; i < this.items.length; i++) {
            menu.addItem(this.items[i]);
        }
    }

    return menu;
};

/**
 * Create the list of menu items. Specific to each subclass.
 */
vjs.MenuButton.prototype.createItems = function(){};

/** @inheritDoc */
vjs.MenuButton.prototype.buildCSSClass = function(){
    return this.className + ' vjs-menu-button ' + vjs.Button.prototype.buildCSSClass.call(this);
};

// Focus - Add keyboard functionality to element
// This function is not needed anymore. Instead, the keyboard functionality is handled by
// treating the button as triggering a submenu. When the button is pressed, the submenu
// appears. Pressing the button again makes the submenu disappear.
vjs.MenuButton.prototype.onFocus = function(){};
// Can't turn off list display that we turned on with focus, because list would go away.
vjs.MenuButton.prototype.onBlur = function(){};

vjs.MenuButton.prototype.onClick = function(){
    // When you click the button it adds focus, which will show the menu indefinitely.
    // So we'll remove focus when the mouse leaves the button.
    // Focus is needed for tab navigation.
  this.one('mouseout', vjs.bind(this, function(){
        this.menu.unlockShowing();
        this.el_.blur();
    }));
  if (this.buttonPressed_){
        this.unpressButton();
    } else {
        this.pressButton();
    }
};

vjs.MenuButton.prototype.onKeyPress = function(event){
    event.preventDefault();

    // Check for space bar (32) or enter (13) keys
    if (event.which == 32 || event.which == 13) {
    if (this.buttonPressed_){
            this.unpressButton();
        } else {
            this.pressButton();
        }
        // Check for escape (27) key
  } else if (event.which == 27){
    if (this.buttonPressed_){
            this.unpressButton();
        }
    }
};

vjs.MenuButton.prototype.pressButton = function(){
    this.buttonPressed_ = true;
    this.menu.lockShowing();
    this.el_.setAttribute('aria-pressed', true);
    if (this.items && this.items.length > 0) {
        this.items[0].el().focus(); // set the focus to the title of the submenu
    }
};

vjs.MenuButton.prototype.unpressButton = function(){
    this.buttonPressed_ = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-pressed', false);
};
/*Popup menu for tracks (captions menu) */
vjs.PopUpMenu = vjs.Component.extend({
    /** @constructor */
    init: function(player, options) {
        vjs.Component.call(this, player, options);
        this.menu = this.createMenu();
        // Add list to element
        this.addChild(this.menu);
        // Automatically hide empty menu buttons
        if (this.items && this.items.length === 0) {
            this.hide();
        }
        this.on('keydown', this.onKeyPress);
        this.el_.setAttribute('aria-label', 'Captions Menu');
        this.el_.setAttribute('role', 'menu'); //role=button
        this.el_.setAttribute('tabindex', '0');
        this.el_.setAttribute('aria-live', 'polite');
    }
});

/**
 * Track the state of the menu button
 * @type {Boolean}
 * @private
 */
vjs.PopUpMenu.prototype.buttonPressed_ = false;

vjs.PopUpMenu.prototype.createMenu = function() {
    var menu = new vjs.Menu(this.player_);

    // Add a title list item to the top
    if (this.options().title) {
        menu.el().appendChild(vjs.createEl('li', {
            className: 'vjs-menu-title',
            innerHTML: vjs.capitalize(this.kind_),
            tabindex: -1
        }));
    }

    this.items = this['createItems']();

    if (this.items) {
        // Add menu items to the menu
        for (var i = 0; i < this.items.length; i++) {
            menu.addItem(this.items[i]);
        }
    }

    return menu;
};

/**
 * Create the list of menu items. Specific to each subclass.
 */
vjs.PopUpMenu.prototype.createItems = function(){
};

vjs.PopUpMenu.prototype.createEl = function(type, props){
    var id;
    if(this.kind_ == 'subtitles'){
        id = 'vjs_Subtitle_';
    }
    else if(this.kind_ == 'captions'){
        id = 'vjs_Caption_';
    }
    var aria_own_text ='aria-owns="';
    var item_count=0,track;
    for (var j = 0; j < this.player_.textTracks().length; j++) {
        track = this.player_.textTracks()[j];
        if (track.kind() === this.kind_) {
            item_count++;
        }
    }
    for (var i = 0; i <= item_count; i++) {
        aria_own_text+=id+i+' ';
    }
    aria_own_text+='"';
    props = vjs.obj.merge({
        className: this.buildCSSClass(),
        innerHTML: '<div class="vjs-control-content" aria-haspopup="true" role="menuitem" '+aria_own_text+'><span class="vjs-control-text">' + (this.buttonText || 'Need Text') + '</span></div>'
    }, props);

    return vjs.Component.prototype.createEl.call(this, type, props);
};

/** @inheritDoc */
vjs.PopUpMenu.prototype.buildCSSClass = function(){
    return this.className + ' vjs-menu-button ' + 'vjs-control ' + vjs.Component.prototype.buildCSSClass.call(this);
};

// Focus - Add keyboard functionality to element
// This function is not needed anymore. Instead, the keyboard functionality is handled by
// treating the button as triggering a submenu. When the button is pressed, the submenu
// appears. Pressing the button again makes the submenu disappear.
vjs.PopUpMenu.prototype.onFocus = function(){
};
// Can't turn off list display that we turned on with focus, because list would go away.
vjs.PopUpMenu.prototype.onBlur = function(){
};

vjs.PopUpMenu.prototype.onClick = function(){
    // When you click the button it adds focus, which will show the menu indefinitely.
    // So we'll remove focus when the mouse leaves the button.
    // Focus is needed for tab navigation.
    this.one('mouseout', vjs.bind(this, function(){
        this.menu.unlockShowing();
        this.el_.blur();
    }));
    if (this.buttonPressed_) {
        this.unpressButton();
    } else {
        this.pressButton();
    }
};

vjs.PopUpMenu.prototype.onKeyPress = function(event){
    event.preventDefault();
    // Check for space bar (32) or enter (13) keys
    if (event.which == 32 || event.which == 13) {
        if (this.buttonPressed_) {
            this.unpressButton();
        } else {
            this.pressButton();
        }
        // Check for escape (27) key
    } else if (event.which == 27) {
        if (this.buttonPressed_) {
            this.unpressButton();
        }
    }
};

vjs.PopUpMenu.prototype.pressButton = function(){
    this.buttonPressed_ = true;
    this.menu.lockShowing();
    this.el_.setAttribute('aria-pressed', true);
    if (this.items && this.items.length > 0){
        for (var i = 0; i < this.items.length; i++)
            if (this.items[i].el_.getAttribute('aria-checked')=='true')
                this.items[i].el().focus();    // set the focus to the checked menuitem
    }
};

vjs.PopUpMenu.prototype.unpressButton = function(){
    this.buttonPressed_ = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-pressed', false);
};

