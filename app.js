
/* event system */

var eventSystem = Ext.create("Ext.util.Observable")



/* views */

Ext.define("app.view.MainView", {
	extend: "Ext.Panel",
	config: {
		id: "mainView",
		fullscreen: true,
		scrollable: {
			direction: "vertical"
		},
		items: [
			{
				xtype: "toolbar",
				id: "navBar",
				docked: "top",
				title: "Todo app",
				items: [{
					xtype: "button",
					id: "newTodoPanelButton",
					text: "new todo",
					docked: "right"
				}]
			}, {
				xtype: "panel",
				id: "newTodoPanel",
				docked: "top",
				style: {
					"margin": "2px 3px 4px",
					"padding": "3px",
					"background": "#aeaeae",
					"box-shadow": "0 2px 2px #888"
				},
				items: [{
					xtype: "textfield",
					id: "newTodoEditor",
					label: "TODO",
					labelWidth: "70px",
					style: {
						"margin-right": "4px"
					}
				}, {
					xtype: "button",
					id: "newTodoCreateButton",
					text: "enter",
					docked: "right",
					style: {
						"border-radius": "3px"
					}
				}]
			}, {
				xtype: "panel",
				id: "mainPanel"
			}, {
				xtype: "toolbar",
				id: "statusToolbar",
				docked: "bottom",
				items: [{
					xtype: "button",
					id: "selectAllButton",
					text: "select all",
					docked: "right"
				}, {
					xtype: "button",
					id: "reverseButton",
					text: "reverse",
					docked: "right"
				}]
			}
		]
	}
})

Ext.define("app.view.TodoListView", {
	extend: "Ext.Panel",
	config: {
		id: "todoListView"
	}
})

Ext.define("app.view.TodoView", {
	extend: "Ext.Panel",
	tpl: "<div>template</div>",
	config: {
		name: "todoView",
		items: [
			{
				xtype: "checkboxfield",
				label: "",
				labelWrap: true,
				labelWidth: "80%",
				maxWidth: "100%",
				style: {
					"border-bottom": "2px solid #ddd",
					"background": "#f1f1f1"
				}
			}, {
				xtype: "textfield",
				clearIcon: false,
				label: "",
				labelWidth: "20px",
				hidden: true
			}
		]
	}
})



/* controllers */

// simple class
Ext.define("app.controller.TodoSingle", {
	init: function(model) {
		this.setup(model)
	},
	setup: function(model) {
		this.model = model
		this.todoView = Ext.create("app.view.TodoView")
		this.checkbox = this.todoView.child("checkboxfield")
		this.textfield = this.todoView.child("textfield")

		this.update()
		this.initEvents()
	},
	initEvents: function() {
		this.checkbox.element.on("longpress", this.onEditing, this)
		this.checkbox.element.on("tap", this.onFlagChange, this)
		this.textfield.on("blur", this.onEditDone, this)
		this.textfield.on("change", this.onTitleChange, this)
		this.model.on("set", this.update, this)
		this.model.on("destroy", this.onModelDestory, this)
	},
	
	/**/
	
	getView: function() {
		return this.todoView
	},
	
	/**/
	
	onEditing: function(evt, el) {
		var value = this.checkbox.getLabel()
		this.textfield.setValue(value)
		this.textfield.select()
		this.checkbox.hide()
		this.textfield.show(true)
		this.textfield.focus()
	},
	onEditDone: function() {
		this.textfield.hide()
		this.checkbox.show(true)
	},
	onTitleChange: function(target, val) {
		val = val.trim()
		if (val === "") { return }
		this.model.set("title", val)
	},
	onFlagChange: function(evt, el) {
		var flag = this.checkbox.isChecked()
		flag = this.checkbox.getHidden() ? !flag : flag
		this.model.set("complete", flag)
	},
	onModelDestory: function() {
		this.destory()
	},
	update: function() {
		this.updateContent()
		this.changeItemStyle()
	},
	changeItemStyle: function() {
		var flag = this.model.get("complete")
		this.highlightItem(flag)
	},
	highlightItem: function(flag) {
		if (flag) {
			this.checkbox.setStyle({
				"background": "#C5F7E8"
			})
		} else {
			this.checkbox.setStyle({
				"background": "#f1f1f1"
			})
		}
	},
	updateContent: function() {
		var title = this.model.get("title"),
			flag = this.model.get("complete")
		this.checkbox.setLabel(title)
		this.checkbox.setChecked(flag)
	}
})

// a class to manager the todo collections
Ext.define("app.controller.Todos", {
	extend: "Ext.app.Controller",
	config: {
		refs: {
			todoListView: "#todoListView",
			newTodoEditor: "#newTodoEditor",
			newTodoCreateButton: "#newTodoCreateButton"
		}
	},
	init: function(todoCollection) {
		this.collection = todoCollection
		this.todoListView = this.getTodoListView()
		this.newTodoEditor = this.getNewTodoEditor()
		
		this.initEvents()
	},
	initEvents: function() {
		this.setControl({
			newTodoEditor: {
				keyup: "onNewTodoKeyup"
			},
			newTodoCreateButton: {
				tap: "onCreating"
			}
		})
		this.collection.on("addrecords", this.onAddTodo, this)
		this.collection.on("load", this.onAddTodo, this)
	},

	/**/

	onAddTodo: function(store, models) {
		var self = this,
			todoSingle,
			todoView
		models.forEach(function(model) {
			todoSingle = Ext.create("app.controller.TodoSingle")
			todoSingle.setup(model)
			todoView = todoSingle.getView()
			self.todoListView.add(todoView)
		})
	},
	onNewTodoKeyup: function(obj, e) {
		// ENTER = 13
		if (e.event.which !== 13) { return }
		this.onCreating()
	},
	onCreating: function(obj, e) {
		value = this.newTodoEditor.getValue().trim()
		if (value === "") { return }
		data = {
			"title": value,
			"complete": false
		}
		this.newTodoEditor.setValue("")
		this.collection.add(data)
		eventSystem.fireEvent("tooltip", data.title)
	}
})


Ext.define("app.controller.Functions", {
	init: function() {
		this.mainView = app.global.mainView
		this.selectAllButton = this.mainView.query("#selectAllButton")[0]
		this.reverseButton = this.mainView.query("#reverseButton")[0]
		this.newTodoPanelButton = this.mainView.query("#newTodoPanelButton")[0]
		this.newTodoPanel = this.mainView.query("#newTodoPanel")[0]
		this.todoCollection = app.global.todoStore

		this.initEvents()
	},
	initEvents: function() {
		this.selectAllButton.on("tap", this.selectAll, this)
		this.reverseButton.on("tap", this.reverse, this)
		this.newTodoPanelButton.on("tap", this.toggleNewTodoPanel, this)
	},
	toggleNewTodoPanel: function() {
		var flag = this.newTodoPanel.isHidden()
		if (flag) {
			this.newTodoPanel.show(true)
		} else {
			this.newTodoPanel.hide(true)
		}
	},
	selectAll: function() {
		var flag = (this.todoCollection.find("complete", false) > -1)
		this.todoCollection.each(function(model) {
			model.set("complete", flag)
		})
	},
	reverse: function() {
		var val
		this.todoCollection.each(function(model) {
			val = model.get("complete")
			model.set("complete", !val)
		})
	}
})


Ext.define("app.controller.tooltip", {
	init: function() {
		this.toastConfig = {
			timeout: 1000,
			modal: false,
			centered: true
		}
		this.initEvents()
	},
	initEvents: function() {
		eventSystem.on("tooltip", this.showTooltip, this)
	},
	showTooltip: function(content) {
		content = this.styleContent(content)
		this.toastConfig.message = content
		Ext.toast(this.toastConfig)
	},
	styleContent: function(content) {
		var box = '<div style="padding:8px 16px;border:2px solid #aaa;border-radius: 3px;background: #eee">{$content}</div>'
		return box.replace("{$content}", content)
	}
})


/* models */

Ext.define("app.model.Todo", {
	extend: "Ext.data.Model",
	config: {
		fields: ["title", "complete", "id"]
	},
	set: function() {
		this.callParent(arguments)
		this.fireEvent("set")
	}
})

Ext.define("app.store.TodoCollection", {
	extend: "Ext.data.Store",
	config: {
		model: "app.model.Todo",
		autoLoad: true,
		proxy: {
			type: "ajax",
			url: "todos.json",
			reader: {
				type: "json",
				rootProperty: "todos"
			}
		}
	}
})



/* main App */

Ext.application({
	name: "senchaTodo",

	launch: function() {
		var ag = app.global = {}
		ag.mainView = Ext.create("app.view.MainView")
		ag.todoListView = Ext.create("app.view.TodoListView")
		ag.todoStore = Ext.create("app.store.TodoCollection")
		ag.todosController = Ext.create("app.controller.Todos", {application: this.getApplication()})
		ag.functionsController = Ext.create("app.controller.Functions")
		ag.tooltipController = Ext.create("app.controller.tooltip")
		
		ag.mainView.child("#mainPanel").add(ag.todoListView)
		ag.todosController.init(ag.todoStore)
		ag.functionsController.init()
		ag.tooltipController.init()
		

		window.global = {
			application: this.getApplication(),
			con: ag.todosController,
			todoListView: ag.todoListView,
			db: sampleDb
		}
		
		Ext.Viewport.add(ag.mainView)
	}
})


