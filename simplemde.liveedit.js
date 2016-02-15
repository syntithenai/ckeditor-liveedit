/**********************************************************
 * This plugin for simplemde provides live collaborative editing features
 * .
 * It must be configured with a pollUrl and a saveUrl (also requestParameters and saveData) for shared persistent
 * storage.
 * It was built to work with the cmfive CRM REST module(https://github.com/2pisoftware/cmfive/) and is configurable 
 * to work with other persistence systems.
 * A sample php persistence implementation is part of the repository.
 * Copyright Steve Ryan <stever@syntithenai.com>
 * Licence https://en.wikipedia.org/wiki/MIT_License
 ****************************************************
 */ 


function SimpleMde_BindLiveEditing(editor) {
			/**************************************
		 * VISIBILITY STATE FUNCTIONS 
		 * - support CROSS BROWSER visibilitychange events to disable and restart polling 
		 *************************************/
		 // determine which vendor prefixed property is available
		function getHiddenProp(){
			var prefixes = ['webkit','moz','ms','o'];
			
			// if 'hidden' is natively supported just return it
			if ('hidden' in document) return 'hidden';
			
			// otherwise loop over all the known prefixes until we find one
			for (var i = 0; i < prefixes.length; i++){
				if ((prefixes[i] + 'Hidden') in document) 
					return prefixes[i] + 'Hidden';
			}

			// otherwise it's not supported
			return null;
		}
		// check if the document is currently hidden
		function isHidden() {
			var prop = getHiddenProp();
			if (!prop) return false;
			
			return document[prop];
		} 
		// called on visibility change event
		function visChange() {
			if (isHidden()) {
				 updatePollActive=false;
			} else {
				updatePollActive=true;
				startUpdatePoll(editor);
			}
		}
		// BIND visibility change event
		// use the property name to generate the prefixed event name
		var visProp = getHiddenProp();
		if (visProp) {
		  var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
		  document.addEventListener(evtname, visChange);
		}
	
	console.log(['change',editor.config]);
	/**************************************************
	 * INIT
	 **************************************************/
	var updatePollActive=true;
	var updateTimer=null;
	var lastModified=editor.config.lastModified;
	// ensure configuration								
	if (!editor.config.pollUrl) alert("Invalid configuration, you must provide configuration option pollUrl to the editor.");
	if (!editor.config.saveUrl) alert("Invalid configuration, you must provide configuration option saveUrl to the editor.");
	if (!editor.config.pollTimeOut) editor.config.pollTimeOut=1000;
	if (!editor.config.saveTimeOut) editor.config.saveTimeOut=3000;
	if (!editor.config.requestParameters) editor.config.requestParameters='';
	
	/**************************************************
	 * POLLING
	 **************************************************/
	// recursive timeout function is called when a request completes
	var callUpdateCallBack=function(record) {
		if (window[editor.config.updateCallBack]) window[editor.config.updateCallBack](record);
	}
	
	function replaceContent(editor,content,record) {
		// save cursor position/selection
		var selection = editor.codemirror.listSelections();
		if (selection.length>0) {
			// modify text
			editor.value(record.body);
			lastModified=record.dt_modified;
			callUpdateCallBack(record);
			// restore selection
			editor.codemirror.focus();
			editor.codemirror.setSelections(selection);
		} else {
			// no selection exists so just modify text
			editor.value(record.body);
			lastModified=record.dt_modified;
			callUpdateCallBack(record);
		}
	}
	
	var startUpdatePoll = function(editor) {
		pollUrl=editor.config.pollUrl;
		if (updateTimer) clearTimeout(updateTimer);
		updateTimer=setTimeout(function() {
			if (updatePollActive) {  
				$.ajax(
					pollUrl +  lastModified + "?" + editor.config.requestParameters,
					{
						cache: false,
						dataType:"json"
					}
				).done(function(content) {
					console.log(JSON.stringify(content));
					if (content && content.success ) {
						if (content.success.length>0 && content.success[0].body) {
							replaceContent(editor,content,content.success[0]);
						}
					}	
				}).always(function() {
					startUpdatePoll(editor);											
				});										
			}// else {
			//	startUpdatePoll(editor);
			//}
		},editor.config.pollTimeOut);
	}
	/**************************************************
	 * SAVE ON KEYUP
	 **************************************************/
	function bindKeyUp(editor) {
		var saveUrl=editor.config.saveUrl;
		var saveTimer=null;
		var callChangeCallBack=function() {
			if (window[editor.config.changeCallBack]) window[editor.config.changeCallBack]();
		}
		var callSaveCallBack=function(record) {
			if (window[editor.config.saveCallBack]) window[editor.config.saveCallBack](record);
		}
		editor.codemirror.on('keyup', function() {
			updatePollActive=false;
			callChangeCallBack();
			if (saveTimer) clearTimeout(saveTimer);
			saveTimer=setTimeout(function() {
				var doSave=function() {
					var val=editor.value();
					var data=editor.config.saveData;
					// first check if there are any recent saves we might overwrite
					$.ajax(
						editor.config.pollUrl + lastModified + "?" + editor.config.requestParameters,
						{data:data,dataType:'json',cache:false}
					).done(
						function(response) {
							var requestSave = function(body) {
								data.body=body;
								$.ajax(
									editor.config.saveUrl  + "?" + editor.config.requestParameters,
									{data:data,dataType:'json',cache:false,method:'POST'}
								).done(
									function(response) {
										if (response.success && response.success.id) {
											replaceContent(editor,response,response.success); 
											callSaveCallBack(response.success);
											updatePollActive=true;
											lastModified=response.success.dt_modified;
										}
										startUpdatePoll(editor);
									}
								).fail(function() {alert('Failed to save.')}) ;
							}
							// no results means we can just save
							if (response.success) {
								if (response.success.length==0)  {
										requestSave(editor.value());
								// existing changes - ask the user to reload or force overwrite	
								} else if (response.success && response.success.length > 0) {
									// reload with other changes
									if (confirm('Your changes conflict with those made by another user. Click OK to reload with their changes or Cancel to force your changes?')) {
										replaceContent(editor,response,response.success[0]); 
										lastModified=response.success[0].dt_modified;
										callUpdateCallBack(response.success[0]);
										startUpdatePoll(editor);
									// force these changes
									} else {
										requestSave(editor.value());
									}
								}
							} else {
								alert('Failed to poll on save');
							}
						}
					) // end done
				}
				doSave();
			},editor.config.saveTimeOut);
			
		});
	}
	 
	
	/***********************************
	 * INIT
	 ***********************************/
	startUpdatePoll(editor);
	bindKeyUp(editor);

}
