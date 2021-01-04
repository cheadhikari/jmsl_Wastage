sap.ui.define([
	"isr/jmsl_Wastage/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(Controller, JSONModel, MessageBox, MessageToast) {
	"use strict";

	return Controller.extend("isr.jmsl_Wastage.controller.LineItems", {

		/*
			Helper Methods
		 */

		_onItemMatched: function(oEvent) {

			var oArgs = oEvent.getParameter("arguments");
			this._pMovetype = oArgs.Movetype;
			this._pSite = oArgs.Site;
			this._pLocation = oArgs.Location;

			this._initItems();

		},

		_getItem: function() {
			var oItem = {
				Article: "",
				Artdesc: "",
				Quantity: "",
				MoveReas: "",
				ArtStatus: "S",
				QtyStatus: "S",
				RsnStatus: "E"
			};

			return oItem;
		},

		_initItems: function(oEvent) {

			var oTable = this.byId("tabLineItems");

			var aItems = [];

			for (var i = 0; i < 1; i++) {
				var oItem = this._getItem();
				aItems.push(oItem);
			}

			var oliModel = new JSONModel(aItems);

			oTable.setModel(oliModel, "liModel");

		},

		_getIndexFromPath: function(oPath) {

			var iIndex = parseInt(oPath.substring(oPath.lastIndexOf('/') + 1), 10);

			return iIndex;
		},

		_readArticle: function(oModel, oArticle) {

			var oView = this.getView();
			oView.setBusy(true);

			return new Promise(function(resolve, reject) {
				oModel.read("/lineitemSet('" + oArticle + "')", {
					success: function(oResult) {
						resolve(oResult);
						oView.setBusy(false);
					},
					error: function(oError) {
						reject(oError);
						oView.setBusy(false);
					}
				});
			});

		},

		_setInputState: function(oInput, oState, oMessage) {
			oInput.setValueState(oState);
			oInput.setValueStateText(oMessage);
		},

		_validateArticle: function(oItem) {

			var oContext = oItem.getBindingContext("liModel");
			var sArticle = oContext.getProperty("Article");
			var oTable = this.byId("tabLineItems");
			var oliModel = oTable.getModel("liModel");
			var oData = oliModel.getData();
			var sPath = oContext.getPath();
			var iIndex = this._getIndexFromPath(sPath);
			var sCurrentFocus = oItem.getId();
			var aSegments = sCurrentFocus.split("-");

			var oInput = sap.ui.getCore().getElementById(oItem.getId());
			this._setInputState(oInput, "None", "");

			if (aSegments) {
				var sNextArtFocus;
				var iNextIndex = parseInt(aSegments[4], 10) + 1;
				sNextArtFocus = aSegments[0] + "-" + aSegments[1] + "--" + aSegments[3] + "-" + iNextIndex;

				var sNextQtyFocus;
				sNextQtyFocus = "inQty-" + aSegments[1] + "--" + aSegments[3] + "-" + aSegments[4];
			}

			oData[iIndex].ArtStatus = "S";

			if (!sArticle) {
				this._setInputState(oInput, "Error", this._geti18nText("msgEBlankArticle"));
				oData[iIndex].Artdesc = "";
				oData[iIndex].ArtStatus = "E";
				oliModel.refresh();
				this._setFocus(sCurrentFocus);
				return;
			}

			var oView = this.getView();
			var oModel = oView.getModel("oModel");

			var oArticle = this._readArticle(oModel, sArticle);
			var that = this;
			oArticle.then(function(oResult) {

				oData[iIndex].Article = oResult.Article;
				oData[iIndex].Artdesc = oResult.Artdesc;
				oData[iIndex].MoveReas = oResult.MoveReas;

				if (oResult.Quantity > 0) {
					oData[iIndex].Quantity = oResult.Quantity;
					that._setFocus(sNextArtFocus);
				} else {
					that._setFocus(sNextQtyFocus);
				}

				oliModel.refresh();

			});

			oArticle.catch(function(oError) {
				that._setInputState(oInput, "Error", that._geti18nText("msgEIncorrectArticle"));
				oData[iIndex].Artdesc = "";
				oData[iIndex].ArtStatus = "E";
				oliModel.refresh();
				that._setFocus(sCurrentFocus);
			});

		},

		_validateQty: function(oItem) {

			var oContext = oItem.getBindingContext("liModel");
			var sQuantity = oContext.getProperty("Quantity");
			var sCurrentFocus = oItem.getId();
			var oTable = this.byId("tabLineItems");
			var oliModel = oTable.getModel("liModel");
			var oData = oliModel.getData();
			var sPath = oContext.getPath();
			var iIndex = this._getIndexFromPath(sPath);

			var oInput = sap.ui.getCore().getElementById(oItem.getId());
			this._setInputState(oInput, "None", "");

			oData[iIndex].QtyStatus = "S";

			if (!sQuantity || sQuantity === "0") {
				this._setInputState(oInput, "Error", this._geti18nText("msgEBlankQuantity"));
				oData[iIndex].QtyStatus = "E";
				this._setFocus(sCurrentFocus);
				oliModel.refresh();
				return;
			}

			var aSegments = sCurrentFocus.split("-");

			if (!aSegments) {
				return;
			}

			var iNextIndex = parseInt(aSegments[4], 10) + 1;
			var sNextFocus = "inArticle-" + aSegments[1] + "--" + aSegments[3] + "-" + iNextIndex;

			var sReason = "selRsn-" + aSegments[1] + "--" + aSegments[3] + "-" + aSegments[4];
			var oReason = sap.ui.getCore().getElementById(sReason);

			if (!this._validateReason(sReason)) {

				this._setInputState(oReason, "Error", this._geti18nText("msgEBlankReason"));

			}

			this._setFocus(sNextFocus);
		},

		_validateReason: function(oField) {

			var oInput = sap.ui.getCore().getElementById(oField);

			if (!oInput) {
				return false;
			}

			var oItem = oInput.getSelectedItem();

			if (oItem) {
				return true;
			}

			return false;

		},

		_setFocus: function(oField) {

			var oInput = sap.ui.getCore().getElementById(oField);

			if (oInput) {
				oInput.focus();
			}

		},

		_clearBlankItems: function(oData) {

			for (var i = 0; i < oData.length; i++) {

				if (oData[i].Article === "") {
					oData.splice(i, 1);
					i--;
				}
			}
		},

		_validateLineItems: function(oData) {

			this._clearBlankItems(oData);

			if (oData.length === 0) {
				return false;
			}

			for (var i = 0; i < oData.length; i++) {
				if (oData[i].ArtStatus === "E" || oData[i].QtyStatus === "E" || oData[i].RsnStatus === "E") {
					return false;
				}
			}

			return true;

		},

		_postMatDoc: function(sSite, sStgeLoc, oModel, aData) {

			var oView = this.getView();

			oView.setBusy(true);

			var iHeadid = 1;
			var aMatDocLines = [];

			for (var i = 0; i < aData.length; i++) {

				var oLine = {
					Headid: iHeadid,
					Lineid: i + 1,
					Article: aData[i].Article,
					Quantity: aData[i].Quantity,
					MoveReas: aData[i].MoveReas
				};

				aMatDocLines.push(oLine);
			}

			var oMatdoc = {
				Headid: iHeadid,
				Matdoc: "",
				Matyear: "",
				Site: sSite,
				StgeLoc: sStgeLoc,
				toMatDocLines: aMatDocLines
			};

			var that = this;
			oModel.create("/matdocheadSet", oMatdoc, {
				success: function(oResult) {
					oView.setBusy(false);
					that._initItems();

					var sSMessage = that._geti18nText("msgSMatDocPosted") + " : " + oResult.Matdoc + "/" + oResult.Matyear;
					MessageBox.success(sSMessage);
				},
				error: function(oError) {
					oView.setBusy(false);

					var oMsg,
						sEMessage;

					try {

						oMsg = JSON.parse(oError.responseText);
						sEMessage = oMsg.error.message.value;

					} catch (err) {

						var oParser = new DOMParser();
						var oXmlDoc = oParser.parseFromString(oError.responseText, "text/xml");
						sEMessage = oXmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;

					}

					MessageBox.error(sEMessage);

				}
			});
		},

		/*
			Events
		 */

		onInit: function() {

			var oTable = this.byId("tabLineItems");
			var oTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Input({
						id: "inArticle",
						value: "{liModel>Article}",
						submit: [this.onArticleEnter, this]
					}),
					new sap.m.Text({
						text: "{liModel>Artdesc}"
					}),
					new sap.m.Input({
						id: "inQty",
						type: "Number",
						value: "{liModel>Quantity}",
						submit: [this.onQtyEnter, this]
					}),
					new sap.m.Select({
						id: "selRsn",
						items: {
							path: "oModel>/movereasSet",
							template: new sap.ui.core.Item({
								key: "{oModel>MoveReas}",
								text: "{oModel>ReasText}"
							})
						},
						selectedKey: "{liModel>MoveReas}",
						forceSelection: false,
						change: [this.onMoveReasChange, this]
					})
				]
			});

			oTable.bindItems("liModel>/", oTemplate);

			var oRouter = this._getRouter();
			oRouter.getRoute("LineItems").attachMatched(this._onItemMatched, this);

		},

		onRowAdd: function(oEvent) {

			var oTable = this.byId("tabLineItems");
			var oModel = oTable.getModel("liModel");
			var aItems = oModel.getData();

			var oItem = this._getItem();
			aItems.push(oItem);

			oModel.setData(aItems);

		},

		onRowDelete: function(oEvent) {

			var oPara = oEvent.getParameter("listItem");
			var oContext = oPara.getBindingContext("liModel");
			var sPath = oContext.getPath();
			var iIndex = this._getIndexFromPath(sPath);

			var oTable = this.byId("tabLineItems");
			var oModel = oTable.getModel("liModel");
			var oData = oModel.getData();
			oData.splice(iIndex, 1);
			oModel.setData(oData);
		},

		onArticleEnter: function(oEvent) {

			var oItem = oEvent.getSource();

			this._validateArticle(oItem);

		},

		onQtyEnter: function(oEvent) {

			var oItem = oEvent.getSource();

			this._validateQty(oItem);

		},

		onMoveReasChange: function(oEvent) {

			var oItem = oEvent.getSource();
			var oContext = oItem.getBindingContext("liModel");
			var oTable = this.byId("tabLineItems");
			var oliModel = oTable.getModel("liModel");
			var oData = oliModel.getData();
			var sPath = oContext.getPath();
			var iIndex = this._getIndexFromPath(sPath);

			oData[iIndex].RsnStatus = "S";

			var oInput = sap.ui.getCore().getElementById(oItem.getId());
			this._setInputState(oInput, "None", "");

		},

		onClear: function(oEvent) {

			var that = this;

			function onConfirm(sCode) {
				if (sCode !== 'OK') {
					return;
				}

				that._initItems();
			}

			var sHeader = this._geti18nText("lblClearItems");
			var sQMessage = this._geti18nText("qtnDeleteItems");
			MessageBox.confirm(sQMessage, onConfirm, sHeader);

		},

		onSave: function(oEvent) {
			var oModel = this.getView().getModel("oModel");
			var oTable = this.byId("tabLineItems");
			var oliModel = oTable.getModel("liModel");
			var aData = oliModel.getData();

			if (this._validateLineItems(aData)) {
				this._postMatDoc(this._pSite, this._pLocation, oModel, aData);
			} else {
				MessageBox.error(this._geti18nText("msgEFixErrors"));
			}

			oliModel.refresh();

		}

	});

});