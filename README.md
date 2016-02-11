# ckeditor-liveedit
    live collaborative editing for ckeditor

This plugin for CKeditor provides live collaborative editing features inside ckeditor.

##Quickstart
To use it, 

1. place the plugin.js file inside a folder called liveedit inside the ckeditor plugins folder.
OR load the plugin manually
CKEDITOR.plugins.addExternal( 'liveedit', '/modules/wiki/assets/ckeditorplugins/liveedit/','plugin.js','' );
2. Once loaded, it is configured by passing parameters to CKEDITOR.replace when you initialise the editor.


#Persistent Storage
It was built to work with the [cmfive](https://github.com/2pisoftware/cmfive/) CRM REST module and is configurable to work with other persistence systems. There is a sample endpoint implementation in plain php as part of this repository. 

To implement your own persistence you need to provide two endpoints. 

Both endpoints must return JSON starting with a single key `success` or `error`.
Inside a success key, the poll end point returns an array of records and the save end point returns a single record.
Each record is an array and must contain a key `body` and a key `dt_modified` when returned from either endpoint.

The modified date is used when polling to only load new records.
The save endpoint must update the modified date when saving a record.

- One endpoint polls for records that are newer than the one currently being edited.
	- `pollUrl: '/rest/index/WikiPage/id___equal/<?php echo $page->id; ?>/dt_modified___greater/',`
    - Additional request parameters can be specified as a string to append to each poll request. For example this could be used to append an authentication token.  
		- `requestParameters: 'token=' + token.success ,`
	- The last modified date for the record is appended to the pollUrl before any requestParameters.
    - The duration between poll requests can be configured using `pollTimeout`
	- When the poll returns an updated record a callback function is provided for custom DOM manipulation.
      	- `updateCallBack: 'my_updateCallBack',`
- The other endpoint accepts post data and saves the editor contents.
	- eg `saveUrl: '/rest/save/WikiPage/',`
	- Additional data can be specified as JSON to send with the save request POST body.
		- `saveData : {"id": "<?php echo $page->id ?>" }`
	- Save requests are triggered by keyup in the editor and buffered until typing has stopped for a period of time configurable by `saveTimeOut: 2000`
	- When a save request is initially triggered, any configured changeCallBack is fired.  			
		- `changeCallBack: 'my_changeCallBack',`
	- When a save request completes successfully, any configured saveCallBack is fired.
		- `saveCallBack: 'my_saveCallBack',`
	- *NOTE* that callbacks are specified as strings and must be available in global context.

	

>		* EG
>		/ ****************************************
>		* CALLBACK FUNCTIONS for custom DOM manipulation.
>		* must be in global scope
>		**************************************** /
>		function my_updateCallBack(record) {
>		$('#viewbody').html(record.body);
>		}
>		function my_changeCallBack() {
>		$('#wikiautosavebuttons').show();
>		$('#wikiautosavebuttons .savebutton').show();
>		$('#wikiautosavebuttons .savedbutton').hide();
>		}
>		function my_saveCallBack(record) {
>		$('#viewbody').html(record.body);
>		$('#wikiautosavebuttons .savebutton').hide();
>		$('#wikiautosavebuttons .savedbutton').show();
>		}
>		$(document).ready(function() {
>		CKEDITOR.plugins.addExternal( 'liveedit', '/modules/wiki/assets/ckeditorplugins/liveedit/','plugin.js','' );
>		CKEDITOR.config.extraPlugins = 'liveedit';
>		/ *************************************************
>		* GET AUTH TOKEN
>		************************************************* /
>		$.ajax(
>		"/rest/token?apikey=<?php echo Config::get("system.rest_api_key") ?>",{cache: false,dataType: "json"}
>		/ *************************************************
>		* NOW CREATE EDITOR
>		************************************************* /
>		).done(function(token) {
>		$('#body').each(function(){
>			CKEDITOR.replace(this,{
>				lastModified: '<?php echo $page->dt_modified ?>',
>				pollUrl: '/rest/index/WikiPage/id___equal/<?php echo $page->id; ?>/dt_modified___greater/',
>				saveUrl: '/rest/save/WikiPage/',
>				updateCallBack: 'my_updateCallBack',
>				changeCallBack: 'my_changeCallBack',
>				saveCallBack: 'my_saveCallBack',
>				saveTimeOut: 2000,
>				pollTimeOut: 3000,
>				requestParameters: 'token=' + token.success ,
>				saveData : {"id": "<?php echo $page->id ?>" }
>			});
>		});
>		});

