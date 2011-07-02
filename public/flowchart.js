var Flowchart;

(function(){
	/**
	* paper - Raphael paper on which the flowchart will be drawn
	* paperDiv - jQuery object containing element containing the paper.
	*  flowchart.js should be completely free to mess with handlers on it.
	*/
	Flowchart = function (paper,paperDiv) {
		this.paper = paper;
		this.paperDiv = paperDiv;
		this.nodeTools = {};
		this.edgeTools = {};
		var _this = this;
		this.setMousemove= function (handler) {
			paperDiv.unbind('mousemove');
			paperDiv.mousemove(handler);
		}
		this.setClick = function(handler) {
			paperDiv.unbind('click');
			paperDiv.click(handler);
		}
		paperDiv.click(function() {
			_this.lastClickedEdgeHook = null;
		})
		paperDiv.mouseleave(function() {
			_this.removeGhost();
		})
	}
	/**
	* name - string that serves as a name for the node tool
	* ghostFunc(x,y) - function that draws a ghost node at x and y
	* shapeFunc(x,y) - function that draws the node's shape at x and y
	* edgeHookCoordinates - array of pairs of relative coordinates for edge hooks
	* defaultText: default text for node
	* shapeAttrs: object containing SVG attributes for the shape
	* textAttrs: object containing SVG attributes for the text
	*/
	Flowchart.prototype.addNodeTool = function(name,ghostFunc,shapeFunc,edgeHookCoordinates,
			defaultText,shapeAttrs,textAttrs) {
		this.nodeTools[name] = new NodeTool(ghostFunc,shapeFunc,edgeHookCoordinates,defaultText,shapeAttrs,textAttrs);
		this.selectedTool || this.selectNodeTool(this.nodeTools[name]); //automatically select a node tool
	}
	/**
	* name - string, name of the node tool to select
	* precondition: name is in this.nodeTools
	*/
	Flowchart.prototype.selectNodeTool = function(name) {
		this.selectedTool = this.nodeTools[name];
		this.setMousemove( this.drawGhostNode() );
		this.setClick( this.drawRealNode() );
	}
	Flowchart.prototype.drawGhostNode = function() {
		var _this = this;
		var tool = this.selectedTool;
		return function(e) {
			var offset = this.paperDiv.offset(), x = e.pageX - offset.left, y = e.pageY - offset.top;
			_this.removeGhost();
			_this.ghost = tool.ghostFunc(x,y);
		}
	}
	Flowchart.prototype.drawRealNode = function() {
		var _this = this;
		var tool = this.selectedTool;
		return function(e) {
			var offset = this.paperDiv.offset(), x = e.pageX - offset.left, y = e.pageY - offset.top;
			_this.removeGhost();
			var newNode = new FlowchartNode(_this,x,y,
				tool.shapeFunc,tool.edgeHookCoordinates,tool.defaultText,tool.shapeAttrs,tool.textAttrs);
		}
	}
	/**
	* name - string that serves as a name for the edge tool
	* ghostFunc(fromHook,x,y) - function that draws a ghost edge from fromHook to (x,y)
	* edgeFunc(fromhook,toHook) - function that draws a real edge from fromHook to toHook
	* edgeAttrs - object containing SVG attributes for the edge
	*/
	Flowchart.prototype.addEdgeTool = function(name,ghostFunc,edgeFunc,edgeAttrs) {
		this.edgeTools[name] = new EdgeTool(ghostFunc,edgeFunc,edgeAttrs);
		this.selectedEdgeTool || this.selectEdgeTool(this.edgeTools[name]);
	}
	Flowchart.prototype.selectEdgeTool = function(name) {
		this.selectedEdgeTool = this.edgeTools[name];
	}
	Flowchart.prototype.drawGhostEdgeFrom = function(fromHook) {
		var _this = this;
		var tool = this.selectedEdgeTool;
		return function(e) {
			var offset = this.paperDiv.offset(), x = e.pageX - offset.left, y = e.pageY - offset.top;
			_this.removeGhost();
			_this.ghost = tool.ghostFunc(fromHook,x,y);
		}
	}
	Flowchart.prototype.drawRealEdgeFrom = function (fromHook) {
		var _this = this;
		var tool = this.selectedEdgeTool;
		return function(e) {
			var offset = this.paperDiv.offset(), x = e.pageX - offset.left, y = e.pageY - offset.top;
			_this.removeGhost();
			if (_this.lastClickedEdgeHook) {
				var newEdge = new FlowchartEdge(_this,fromHook,_this.lastClickedEdgeHook);
			}
			_this.setMousemove( _this.drawGhostNode() );
			_this.setClick( _this.drawRealNode() );
		}
	}
	Flowchart.prototype.removeGhost = function() {
		!this.ghost || this.ghost.remove();
	}
	
	var NodeTool = function(owner,ghostFunc,shapeFunc,edgeHookCoordinates,defaultText,shapeAttrs,textAttrs) {
		return {ghostFunc:ghostFunc, shapeFunc:shapeFunc, edgeHookCoordinates:edgeHookCoordinates,
			defaultText:defaultText, shapeAttrs:shapeAttrs,textAttrs:textAttrs};
	}
	
	/**
	* owner - Flowchart that owns the node
	* x - x coordinate relative to paper
	* y - y coordinate relative to paper
	* shapeFunc - takes arguments paper, x, y, returns a shape
	*  drawn on the paper at (x,y)
	* edgeHookCoordinates: array of pairs of coordinates relative
	*  to x andd y
	* defaultText: default text for the node
	* shapeAttrs: object containing SVG attributes for the shape
	* textAttrs: object containing SVG attributes for the text
	*/
	var FlowchartNode = function (owner,x,y,shapeFunc,
						edgeHookCoordinates,defaultText,shapeAttrs,textAttrs) {
		//set up instance variables
		this.owner = owner;
		var paper = owner.paper;
		this.prototype = paper.set();
		this.shape = shapeFunc(paper,x,y).attr(shapeAttrs);
		this.edgeHooks = this.makeEdgeHooks(edgeHookCoordinates);
		this.text = paper.text(x,y,defaultText).attr(textAttrs);
		this.edges = [];
		//put Raphael set together
		this.push(shape,text);
		var _this = this;
		edgeHooks.map(function(hook) {_this.push(hook)});
	}
	/**
	* edgeHookCoordinates:
	*/
	FlowchartNode.prototype.makeEdgeHooks = function (edgeHookCoordinates) {
		function makeEdgeHook(coordPair) { return new EdgeHook(this,coordPair[0],coordPair[1]); }
		return edgeHookCoordinates.map(makeEdgeHook);
	}
	
	/**
	* owner - Flowchart that owns the edge
	* fromHook - EdgeHook where edge starts
	* toHook - EdgeHook where edge ends
	* pathAttrs - object containing SVG attributes for the path
	*/
	var FlowchartEdge = function (owner,fromHook,toHook,pathAttrs) {
		this.owner = owner;
		this.fromHook = fromHook;
		this.toHook = toHook;
		this.pathAttrs = pathAttrs;
		this.updatePath();
		owner.edges.push(this);
	}
	/**
	* Updates the edge's path to coincide with the new position of its hooks.
	*/
	FlowchartEdge.prototype.updatePath = function() {
		var fromHook = this.fromHook;
		var toHook = this.toHook;
		var deltaX = toHook.attr('cx') - fromHook.attr('cx');
		var deltaY = toHook.attr('cy') - fromHook.attr('cy');
		this.prototype = paper.path("M" + fromHook.attr('cx') + ","
			+ fromHook.attr('cy') + "l" + deltaX + ',' + deltaY).attr(this.pathAttrs);
	}
	
	/**
	* owner - FlowchartNode that owns the edge hook
	* relativeX - x coordinate relative to owner
	* relativeY - y coordinate relative to owner
	* nonHoverAttrs - object containing SVG attributes for the edge hook
	*  when not hovered
	* hoverAttrs - object containing SVG attributes for the edge hook when
	*  hovered
	*/
	var EdgeHook = function (owner,relativeX,relativeY,nonHoverAttrs,hoverAttrs) {
		var oX = owner.attr('cx'), oY = owner.attr('cy');
		this.owner = owner;
		var flowchart = owner.owner;
		var paper = owner.paper;
		this.prototype = paper.ellipse(oX + relativeX, oY + relativeY, 2, 2).attr(nonHoverAttrs);
		var _this = this;
		this.hover(
			function(){
				_this.attr(hoverAttrs);
				flowchart.setMousemove( function(e) {} );
				flowchart.setClick(
					function(e) {
						flowchart.setMousemove( flowchart.drawGhostEdgeFrom(_this) );
						flowchart.setClick( flowchart.drawRealEdgeFrom(_this) );
					} );
			},
			function(){
				_this.attr(nonHoverAttrs) ;
				flowchart.setMousemove( flowchart.drawGhostNode() );
				flowchart.setClick( flowchart.drawRealNode() );
			}
		);
		this.click(
			function() {
				flowchart.lastClickedEdgeHook = _this;
			})
	}
})();