const IMAGE_PROP_CONTR = 'display_image_prop';
const IMAGE_CONTR = "display_upload_image";
const TOOLTIP_CLS = "pc-charts-tooltip";
const DESC_EDITOR = '<div id="popup_window" class="modal"><div class="modal-content animate"><div class="container"><label for="description"><b>Description</b></label><input type="text" id ="input_description" placeholder="Enter description" name="description" required></div><div class="container flex-box"><button type="button" id = "save" class="loginbtn">Save</button><button type="button" id = "cancel"  class="cancelbtn">Cancel</button></div></div></div>';
const IMAGE_TABLE = 'image_tab_container';
const FONT = "100 14px arial";
const RED_COLOR = '#FF0000';
const TABLE_HEADER = ["X Pos", "Y Pos", "Description"];

/**
 * @class ImageMapper
 * @description ImageMapper class which handle application. 
 */
class ImageMapper {
	/**
	 * @description  class constructor
	 * @param {object} args 
	 */
	constructor(args) {
		this.init(args);
		this.renderPlot();
	}
	/**
	 * @description initialize method.
	 * @method init
	 * @param {object} args
	 */
	init(args) {
		this.img = args.img;
		this.imageProp = args.imageProp || {};
		this.info = [];
		this.mousePos = {};
	}
	/**
	 * @description rendering method.
	 * @method renderPlot
	 */
	renderPlot() {
		this.displayImageProperty();
		this.renderCanvas();
		this.addRedDot();
		this.createTooltip();
	}
	/**
	 * @description Method helps to render image properties.
	 * @method displayImageProperty
	 */
	displayImageProperty() {
		let imageProp = this.imageProp,
			imageInfo = document.querySelector("#" + IMAGE_PROP_CONTR),
			propArr = Object.keys(imageProp);
		try {
			propArr.forEach(function (d) {
				let span = document.createElement('span'),
					li = document.createElement('li');
				span.innerHTML = d + " : " + imageProp[d];
				li.appendChild(span);
				imageInfo.appendChild(li);
			});
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to render image over a canvas.
	 * @method renderCanvas
	 */
	renderCanvas() {
		let me = this,
			img = this.img,
			container = document.querySelector("#" + IMAGE_CONTR),
			canvas = document.createElement('canvas');
		try {
			canvas.width = img.width;
			canvas.height = img.height;
			container.appendChild(canvas);
			me.canvas = canvas;
			me.ctx = ImageMapper.setupCanvas(me.canvas);

			let dpr = (window.devicePixelRatio) || 1;
			me.ctx.restore();
			me.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			me.ctx.clearRect(0, 0, img.width, img.height);
			me.ctx.save();
			me.ctx.drawImage(img, 5, 5);

			canvas.addEventListener('mousemove', function (event) {
				let x = event.offsetX,
					y = event.offsetY;
				me.updateTooltip(x, y);
			});
			canvas.addEventListener('click', function (event) {
				let x = event.pageX || event.layerX,
					y = event.pageY || event.layerY,
					x1 = event.offsetX,
					y1 = event.offsetY;

				me.showEditor({
					x: x,
					y: y,
					x1: x1,
					y1: y1
				});
			}, false);
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to add red dot on image.
	 * @method addRedDot
	 */
	addRedDot() {
		let me = this,
			ctx = me.ctx,
			img = me.img,
			xPos = img.width / 2,
			yPos = img.height / 4;
		try {
			ctx.fillStyle = RED_COLOR;
			ctx.beginPath();
			ctx.arc(xPos, yPos, 10, 0, 2 * Math.PI);
			ctx.fill();
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to create tooltip container
	 * @method createTooltip
	 */
	createTooltip() {
		let me = this,
			tooltipContr = document.querySelector("." + TOOLTIP_CLS);
		try {
			if (tooltipContr) {
				me.toolTip = tooltipContr;
			} else {
				let container = document.createElement("div"),
					span = document.createElement("span"),
					body = document.querySelector("body");
				container.className = TOOLTIP_CLS;
				container.style.zIndex = 5;
				container.style.display = "none";
				span.className = TOOLTIP_CLS;
				container.appendChild(span);
				body.appendChild(container);
				me.toolTip = container;
			}
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to remove tooltip on mouse out
	 * @method removeToolTip
	 */
	removeToolTip() {
		let contr = document.querySelector("." + TOOLTIP_CLS);
		contr.style.display = "none";
	}
	/**
	 * @description To generate the tooltip data items based on config.
	 * @method updateTooltip
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	updateTooltip(x, y) {
		let me = this,
			info = me.info,
			hitBox,
			i;
		try {
			me.removeToolTip();
			if (info && info.length) {
				let lh = info,
					lhLen = lh.length,
					toolTip = me.toolTip;
				for (i = 0; i < lhLen; i++) {
					hitBox = lh[i];
					if (x >= hitBox.x1 && x <= hitBox.width && y >= hitBox.y1 && y <= hitBox.height) {
						toolTip.style.width = "auto";
						toolTip.style.whiteSpace = "nowrap";
						toolTip.style.left = hitBox.x1 + "px";
						toolTip.style.top = event.pageY + "px";
						toolTip.style.fontSize = "10px";
						toolTip.style.lineHeight = "12px";
						toolTip.style.display = "block";
						toolTip.setHTML("<strong>Description : " + hitBox.value + "</strong>");
					}
				}
			}
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description mouse click description cancel event handler.
	 * @method onCancel
	 */
	onCancel() {
		let div = document.getElementById("desc_info");
		if (div) {
			document.body.removeChild(div);
		}
	}
	/**
	 * @description mouse click description save event handler.
	 * @method saveInfo
	 */
	saveInfo() {
		let me = this,
			input = document.getElementById("input_description"),
			description = input.value,
			pos = me.mousePos,
			ctx = me.ctx,
			txtWidth = ctx.measureText(description).width;
		try {
			ctx.font = FONT;
			ctx.textAlign = "left";
			ctx.textBasline = "middle";
			ctx.strokeText(description, pos.x1, pos.y1);
			let obj = {
				x: pos.x,
				y: pos.y,
				x1: pos.x1,
				y1: pos.y1 - 5,
				width: (pos.x1 + txtWidth),
				height: (pos.y1 + 5),
				value: description
			};
			me.info.push(obj);
			me.onCancel();
			me.generateTable();
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to show editor.
	 * @method showEditor
	 * @param {Object} pos
	 */
	showEditor(pos) {
		let me = this;
		try {
			me.onCancel();
			let div = document.createElement('div');
			div.id = 'desc_info';
			div.style.top = pos.y + 'px';
			div.style.left = pos.x + 'px';
			div.style.position = 'absolute';
			div.style.display = 'block';
			div.setHTML(DESC_EDITOR);
			document.body.appendChild(div);

			me.mousePos = pos;
			let save = document.querySelector("#save"),
				cancel = document.querySelector("#cancel");
			save.addEventListener("click", () => {
				me.saveInfo();
			});
			cancel.addEventListener("click", () => {
				me.onCancel();
			});
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to generate table.
	 * @method generateTable
	 */
	generateTable() {
		let data = this.generateTableData(),
			dvTable = document.querySelector("#" + IMAGE_TABLE),
			table = document.createElement("TABLE");
		try {
			dvTable.innerHTML = "";
			table.border = "1";

			let columnCount = data[0].length,
				row = table.insertRow(-1);
			for (let i = 0; i < columnCount; i++) {
				let headerCell = document.createElement("TH");
				headerCell.innerHTML = data[0][i];
				row.appendChild(headerCell);
			}
			//Add the data rows.
			for (let i = 1; i < data.length; i++) {
				row = table.insertRow(-1);
				for (let j = 0; j < columnCount; j++) {
					let cell = row.insertCell(-1);
					cell.innerHTML = data[i][j];
				}
			}
			dvTable.appendChild(table);
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to generate table data
	 * @method generateTableData
	 */
	generateTableData() {
		let me = this;
		try {
			let data = me.info.map(function (d) {
				return [d.x1, d.y1, d.value];
			});
			data.unshift(TABLE_HEADER);
			return data;
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to read file.
	 * @method openFile
	 * @param {HTMLObject} inputFile 
	 */
	static openFile(inputFile) {
		let me = this,
			input = inputFile.target,
			file = input.files[0],
			imageProp = {};

		imageProp.Name = file.name;
		imageProp.Type = file.type;
		try {
			let reader = new FileReader();
			reader.onload = function () {
				let dataURL = reader.result,
					image = new Image();
				image.src = dataURL;
				image.onload = function () {
					imageProp.Dimension = image.width + " * " + image.height;
					ImageMapper.clearPanel();
					return new ImageMapper({
						img: image,
						imageProp: imageProp
					});
				};
			};
			reader.readAsDataURL(file);
		} catch (err) {
			console.log(err.message);
		}
	}

	/**
	 * @description Method helps to set pixel ratio for canvas.
	 * @method setupCanvas
	 *	@param {HTMLObject} canvas
	 */
	static setupCanvas(canvas) {
		let me = this;
		try {
			let dpr = (window.devicePixelRatio) || 1,
				rect = canvas.getBoundingClientRect();
			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;
			let ctx = canvas.getContext('2d');
			ctx.scale(dpr, dpr);
			return ctx;
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to clear panel.
	 * @method clearPanel
	 */
	static clearPanel() {
		document.querySelector("#" + IMAGE_PROP_CONTR).setHTML("");
		document.querySelector("#" + IMAGE_CONTR).setHTML("");
		document.querySelector("#" + IMAGE_TABLE).setHTML("");
	}
}