const KEY_LOW = "3. low";
const KEY_HIGH = "2. high";
const KEY_CLOSE = "4. close";
const KEY_PLOT = "Time Series (60min)";
const DATE = 'date';
const DD_BOX = 'symbol_search_select';
const INPUT = "symbol_search_input";
const IBM = 'IBM';
const KEY_SYMBOL = "1. symbol";
const KEYWORD_SEARCH_URL = "https://www.alphavantage.co/query?function=SYMBOL_SEARCH&apikey=JZ4K6RNO4Z98YE3Y&keywords=";
const SYMBOL_SEARCH_URL = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&interval=60min&apikey=JZ4K6RNO4Z98YE3Y&symbol=";
const TOOLTIP_CFG = {
	"Open": "1. open",
	"High": "2. high",
	"Low": "3. low",
	"Close": "4. close",
	"Volume": "5. volume"
};
const HIGH_COLOR = '#008000';
const LOW_COLOR = '#FF0000';
const CLOSE_COLOR = '#03a9f4';
const COMBO_DEFAULT = [{
	"1. symbol": "Choose Symbol",
	"2. name": "Choose Symbol",
	"3. type": "Choose Symbol",
	"4. region": "Choose Symbol",
	"5. marketOpen": "09:30",
	"6. marketClose": "16:00",
	"7. timezone": "UTC-04",
	"8. currency": "USD",
	"9. matchScore": "0.00"
}, {
	"1. symbol": "IBM",
	"2. name": "International Business Machines Corp",
	"3. type": "Equity",
	"4. region": "United States",
	"5. marketOpen": "09:30",
	"6. marketClose": "16:00",
	"7. timezone": "UTC-04",
	"8. currency": "USD",
	"9. matchScore": "1.0000"
}];


/**
 * @class Symbol
 * @description Symbol class which handle application. 
 */
class Symbol {
	/**
	 * @description  class constructor
	 * @param {object} args 
	 */
	constructor(args) {
		this.init(args)
		this.setData()
		this.plotChart()
	}
	/**
	 * @description initialize method.
	 * @method init
	 * @param {object} args
	 */
	init(args) {
		this.divId = args.divId || 'charts';
		this.data = args.data || {};
		this.width = args.width || '1000';
		this.height = args.height || 600;
		this.nextCol = 1;
		this.colorToNode = {};
		this.plotData = this.data[KEY_PLOT];
	}

	/**
	 * @description method helps to plot chart.
	 * @method plotChart
	 */
	plotChart() {
		try {
			/*render chart components*/
			this.setCanvas()
			this.setAspectRatio()
			this.chartLine()
			this.diagram()
			this.getInfo()
			/*render low line*/
			this.draw(this.low, LOW_COLOR);
			this.pointes(this.low, LOW_COLOR);
			/*render high line*/
			this.draw(this.high, HIGH_COLOR);
			this.pointes(this.high, HIGH_COLOR);
			/*render close line*/
			this.draw(this.close, CLOSE_COLOR);
			this.pointes(this.close, CLOSE_COLOR);
			/*create tooltips*/
			this.createTooltip();
			this.tpl = this.genTplString(TOOLTIP_CFG);
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to set data and other configs.
	 * @method setData
	 */
	setData() {
		let me = this;
		try {
			let plotData = Object.keys(me.plotData);
			let chartData = plotData.map(function (d) {
				let date = new Date(d);
				return {
					value: d,
					date: date.getDate(),
					time: date.getTime()
				};
			});

			let uniqueRecords = [
				...new Map(chartData.map((item) => [item[DATE], item])).values(),
			];
			let uniqueData = uniqueRecords.map(function (d) {
				return d.value;
			});

			let dataY = uniqueData.length > 10 ? uniqueData.slice(0, 10) : uniqueData;
			me.dataY = dataY.sort(function (a, b) {
				return new Date(a).getTime() - new Date(b).getTime();
			});


			me.low = me.dataY.map(function (d) {
				return Number(me.plotData[d][KEY_LOW]);
			});
			me.high = me.dataY.map(function (d) {
				return Number(me.plotData[d][KEY_HIGH]);
			});
			me.close = me.dataY.map(function (d) {
				return Number(me.plotData[d][KEY_CLOSE]);
			});

			me.yVal = [...me.low, ...me.high];
			me.dataX = [...me.low, ...me.high];
			me.un = Math.max(Math.ceil((Math.max(...me.yVal) - Math.min(...me.yVal)) / me.high.length), 1);
			me.ys = (me.width - 40) / me.dataY.length;

		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to set canvas to container.
	 * @method setCanvas
	 */
	setCanvas() {
		let me = this;
		let container = document.querySelector("#" + me.divId);
		try {
			me.canvas = me.createCanvas({
				width: me.width,
				height: me.height,
				id: 'main_canvas',
				className: 'main_canvas_comp'
			});
			/*Mouse events for canvas to handle tooltip*/
			me.canvas.addEventListener('mousemove', function (event) {
				let x = event.offsetX || event.layerX,
					y = event.offsetY || event.layerY;
				me.updateTooltip(x, y);
			});

			container.appendChild(me.canvas);
			me.ctx = me.setupCanvas(me.canvas);

			let dpr = (window.devicePixelRatio) || 1;
			me.ctx.restore();
			me.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			me.ctx.clearRect(0, 0, me.width, me.height);
			me.ctx.save();

			me.hiddenCanvas = me.createCanvas({
				width: me.width,
				height: me.height,
				id: 'hidden_canvas',
				className: 'hidden_canvas_comp',
				display: 'none'
			});
			container.appendChild(me.hiddenCanvas);
			me.hiddenCtx = me.setupCanvas(me.hiddenCanvas);
			me.hiddenCanvas.style.display = "none";

		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to set aspect ratio
	 * @method setAspectRatio
	 */
	setAspectRatio() { 
		let me = this,
			ctx = me.ctx,
			hiddenCtx = me.hiddenCtx,
			dpr = (window.devicePixelRatio) || 1;
		try {
			ctx.restore();
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, me.width, me.height);
			ctx.save();

			hiddenCtx.restore();
			hiddenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
			hiddenCtx.clearRect(0, 0, me.width, me.height);
			hiddenCtx.save();
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to render x and y grid lines.
	 * @method diagram
	 */
	diagram() {
		let y = 60,
			x = 1,
			ctx = this.ctx,
			w = this.width,
			h = this.height;
		try {
			ctx.strokeStyle = "#a7a7a7";
			while (y < w) {
				ctx.beginPath();
				ctx.moveTo(y, 0);
				ctx.lineTo(y, h - 30);
				ctx.stroke();
				y += 30;
			}
			while (x < h - 30) {
				ctx.beginPath();
				ctx.moveTo(60, x);
				ctx.lineTo(w, x);
				ctx.stroke();
				x += 30;
			}
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to render x and y axis line.
	 * @method chartLine
	 */
	chartLine() {
		let y = 60,
			ctx = this.ctx,
			w = this.width,
			h = this.height;
		try {
			ctx.strokeStyle = "#000";
			ctx.beginPath();
			ctx.moveTo(y, 0);
			ctx.lineTo(y, h - 30);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(w, h - 30);
			ctx.lineTo(y, h - 30);
			ctx.stroke();
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to render line.
	 * @method draw
	 * @param {Array} dataX
	 * @param {String} color
	 */
	draw(dataX, color) {
		let y = 60,
			x = 0,
			ctx = this.ctx,
			ys = this.ys,
			un = this.un;
		try {

			ctx.save();
			ctx.strokeStyle = color || "#03a9f4";
			ctx.lineWidth = 3;
			ctx.beginPath();
			let line = 30;
			for (let data of dataX) {
				let max = Math.max(...dataX),
					test = 30;
				while (max > data) {
					max = max - 1
					test += line / un
				}
				ctx.lineTo(30 + y, test)
				x = 30
				y += ys
			}
			ctx.stroke()
			ctx.restore();
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to position points/circle over the chart.
	 * @method pointes
	 * @param {Array} dataX 
	 * @param {String} color
	 */
	pointes(dataX, color) {
		let me = this,
			y = 60,
			x = 0,
			ctx = this.ctx,
			dataY = this.dataY,
			ys = this.ys,
			line = 30,
			un = this.un;
		try {
			ctx.fillStyle = color || "#03a9f4";
			dataX.forEach(function (data, i) {
				var max = Math.max(...dataX),
					test = 30;
				while (max > data) {
					max = max - 1;
					test += line / un;
				}
				me.circle(30 + y, test, dataY[i]);
				x = 30;
				y += ys;
			});
			ctx.stroke();
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to render x and y axis labels.
	 * @method getInfo
	 */
	getInfo() {
		let y = 60,
			x = 30,
			ctx = this.ctx,
			h = this.height,
			dataX = this.dataX,
			n = Math.max(...dataX),
			dataY = this.dataY,
			ys = this.ys,
			un = this.un;
		try {
			for (let ydata of dataY) {
				ctx.font = "12px Arial";
				ctx.fillText(ydata, y, h - 10);
				y += ys;
			}
			while (x < h - 30) {
				ctx.font = "11px Arial";
				ctx.fillText(n.toFixed(2), 0, x + 5);
				n = n - un;
				x += 30;
			}
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to render circle over canvas.
	 * @method circle
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {String} point 
	 */
	circle(x, y, point) {
		let me = this,
			ctx = this.ctx,
			hiddenCtx = this.hiddenCtx,
			randomClr = me.genColor();

		try {
			me.colorToNode[randomClr] = me.plotData[point];
			ctx.beginPath();
			ctx.arc(x, y, 4, 0, 2 * Math.PI);
			ctx.fill();

			hiddenCtx.fillStyle = randomClr;
			hiddenCtx.beginPath();
			hiddenCtx.arc(x, y, 6, 0, 2 * Math.PI);
			hiddenCtx.fill();
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to generate different colors.
	 * @method genColor
	 * @return {String} col 
	 */
	genColor() {
		var me = this,
			col,
			ret = [];
		try {
			ret = [];
			if (me.nextCol < 16777215) {
				ret.push(me.nextCol & 0xff); //R
				ret.push((me.nextCol & 0xff00) >> 8); //G
				ret.push((me.nextCol & 0xff0000) >> 16); //B
				me.nextCol += 1;
			}
			col = "rgb(" + ret.join(',') + ")";
			return col;
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
			tooltipDiv = document.querySelector(".pc-charts-tooltip");
		try {
			if (tooltipDiv) {
				me.toolTip = tooltipDiv;
			} else {
				let container = document.createElement("div");
				container.className = "pc-charts-tooltip";
				container.style.zIndex = 5;
				container.style.display = "none";
				let table = document.createElement("table");
				table.className = "pc-charts-tooltip";
				let tbody = document.createElement("tbody");
				table.appendChild(tbody);
				container.appendChild(table);
				me.toolTip = document.querySelector("body").appendChild(container);
			}
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description method helps to remove tooltip on mouse over.
	 * @method removeToolTip
	 */
	removeToolTip() {
		document.querySelector(".pc-charts-tooltip").style.display = "none";
	}
	/**
	 * @description To generate the tooltip data items based on config.
	 * @method updateTooltip
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	updateTooltip(x, y) {
		let me = this,
			col = me.hiddenCtx.getImageData(x, y, 1, 1).data,
			color = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')',
			data = me.colorToNode[color],
			tplStr = this.tpl;

		try {
			me.removeToolTip();
			if (data) {
				let displayData = "";
				if (data.constructor === Object) {
					displayData += me.generateTplData(data, tplStr);
				}
				if (displayData) {
					let result = '';
					displayData.split('<br>').forEach(function (d) {
						if (d.trim().length) {
							let dataSet = d.split('::'),
								dataLen = dataSet.length,
								dataVal = dataSet[dataLen - 1];
							if (dataLen > 1) {
								result += '<tr>';
								dataSet.forEach(function (kx, i) {
									kx = kx.replace("<b>undefined</b>", "");
									result += (i == 0) ? ('<td>' + kx + '</td>') + ('<td>' + ':' + '</td>') : ('<td>' + kx + '</td>');
								});
								result += '</tr>';
							} else if (dataLen === 1) {
								result += '<tr> <td>' + dataVal + '</td> <tr>';
							}
						}
					});

					this.toolTip.style.width = 'auto';
					this.toolTip.style.whiteSpace = 'nowrap';
					this.toolTip.style.left = x + 'px';
					this.toolTip.style.top = y + 'px';
					this.toolTip.style.fontSize = '10px';
					this.toolTip.style.lineHeight = '12px';
					this.toolTip.style.display = 'block';

					let table = this.toolTip.querySelector("table"),
						tableBody = table.querySelector("tbody");
					tableBody.setHTML(result);
				}
			}
		} catch (err) {
			console.log(err.message);
		}

	}
	/**
	 * @description To generate updated tooltip string.
	 * @method generateTplData
	 * @param {Object} data
	 * @param {String} tpl
	 */
	generateTplData(data, tpl) {
		let me = this,
			res = "",
			value = "";
		do {
			let start = tpl.search("{"),
				end = tpl.search("}");
			if (start == -1 || end == -1) {
				res += tpl.substring(0, tpl.length);
				tpl = "";
			} else {
				// Add this key : value pair to tooltip iff value is present.
				let tplKey = tpl.substring(start + 1, end);
				res += tpl.substring(0, start);
				value = data[tplKey];
				if (value) {
					res += value
				}
				tpl = tpl.substring(end + 1, tpl.length);
			}
		} while (tpl.length > 0);
		return res + " " + tpl;
	}
	/**
	 * @description To generate tooltip string for chart.
	 * @method genTplString
	 * @param {Object} config
	 */
	genTplString(config) {
		let me = this,
			tplStr,
			splitter = "::";
		try {
			for (let key in config) {
				if (config.hasOwnProperty(key)) {
					if (typeof config[key] === "object") {
						if (config[key] instanceof Array) {
							tplStr = tplStr ? tplStr + key + splitter + " <b>{" + config[key][0] + "}</b>&nbsp;<b>{" + config[key][1] + "}</b><br>" : key + splitter + " <b>{" + config[key][0] + "}</b>&nbsp;{" + config[key][1] + "}<br>";
						} else {
							let innerObj = config[key];
							tplStr = tplStr ? tplStr + key + splitter : '';
							for (let inKey in innerObj) {
								if (innerObj.hasOwnProperty(inKey)) {
									if (me.dataIndex.indexOf(innerObj[inKey]) != -1) {
										tplStr = tplStr ? tplStr + "<b>{" + innerObj[inKey] + "}</b>" : inKey + "<b>{" + innerObj[inKey] + "}</b>";
									} else {
										tplStr = tplStr ? tplStr + ' ' + innerObj[inKey] + ' ' : '';
									}
								}
							}
							tplStr = tplStr ? tplStr + '<br>' : '';
						}
					} else {
						tplStr = tplStr ? tplStr + key + splitter + " <b>{" + config[key] + "}</b><br>" : key + splitter + " <b>{" + config[key] + "}</b><br>";
					}
				}
			}
			return tplStr;
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method to create canvas component.
	 * @method createCanvas
	 * @param {Object} config
	 */
	createCanvas(config) {
		let width = config.width,
			height = config.height,
			id = config.id,
			className = config.className;
		try {
			let row = document.createElement('canvas');
			row.className = className;
			row.id = id;
			row.height = height;
			row.width = width;
			return row;
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to set pixel ratio for canvas.
	 * @method setupCanvas
	 *	@param {HTMLObject} canvas
	 */
	setupCanvas(canvas) {
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
	 * @description Method to fetch symbols based on keyword.
	 * @method getSymbols
	 * @param {String} url
	 */
	static getSymbols(url) {
		let me = this;
		try {
			fetch(url)
				.then(result =>
					result.json()
				)
				.then(data => {
					if (data && data.bestMatches) {
						me.addSymbols(data.bestMatches);
					}

				}).catch((error) => {
					console.error('Error:', error);
				});
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to add symbols to drop down box.
	 * @method addSymbols
	 * @param {Array} data
	 */
	static addSymbols(data) {
		let me = this,
			ddb = document.querySelector("#" + DD_BOX);
		try {
			ddb.options.length = 0;
			COMBO_DEFAULT.forEach(function (d) {
				me.addOptions(ddb, d);
			});
			if (data.length) {
				data.forEach(function (d) {
					let symbol = d[KEY_SYMBOL];
					if (symbol != IBM) {
						me.addOptions(ddb, d);
					}
				});
			}
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method to search symbols based on keyword.
	 * @method searchSymbol
	 */
	static searchSymbol() {
		let input = document.querySelector("#" + INPUT),
			keyword = input.value;
		try {
			if (keyword) {
				let url = KEYWORD_SEARCH_URL + keyword;
				this.getSymbols(url);
			}
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to get data for the symbol.
	 * @method getStockData
	 */
	static getStockData() {
		let ddb = document.querySelector("#" + DD_BOX);
		try {
			if (ddb.selectedIndex && ddb.selectedOptions && ddb.selectedOptions.length) {
				let cfg = ddb.selectedOptions[0].cfg,
					symbol = cfg && cfg[KEY_SYMBOL] || "";
				if (symbol) {
					let url = SYMBOL_SEARCH_URL + symbol;
					fetch(url)
						.then(result =>
							result.json()
						)
						.then(data => {
							if (data.hasOwnProperty(KEY_PLOT)) {
								let container = document.querySelector("#chart"),
									width = container.clientWidth - 40,
									height = container.clientHeight - 40;

								container.setHTML("");
								let config = {
									data: data,
									divId: "chart",
									width: width,
									height: height
								}
								return new Symbol(config);
							} else {
								alert(JSON.stringify(data));
								console.error('Error:', JSON.stringify(data));
							}
						})
						.catch((error) => {
							console.error('Error:', error);
						});
				}
			}
		} catch (err) {
			console.log(err.message);
		}
	}
	/**
	 * @description Method helps to add options dynamically to drop down box.
	 * @method addOptions
	 */
	static addOptions(ddBox, data) {
		let opt = document.createElement('option');
		opt.value = data[KEY_SYMBOL];
		opt.text = data[KEY_SYMBOL];
		opt.cfg = data;
		ddBox.options.add(opt);
	}
}