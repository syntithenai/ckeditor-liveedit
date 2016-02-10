# ckeditor-liveedit
    live collaborative editing for ckeditor

This plugin for CKeditor provides live collaborative editing features inside ckeditor.


It must be configured with a pollUrl and a saveUrl (also requestParameters and saveData) for shared persistent storage.
 
 
 It was built to work with the cmfive CRM REST module and is hopefully sufficiently configurable to work with other persistence systems.

To use it, place the plugin.js file inside a folder called liveedit inside the ckeditor plugins folder.
OR load the plugin manually
CKEDITOR.plugins.addExternal( 'liveedit', '/modules/wiki/assets/ckeditorplugins/liveedit/','plugin.js','' );

Once loaded, it is configured by passing parameters to 	CKEDITOR.replace when you initialise the editor.


       * 
       * EG
      / ****************************************
       * CALLBACK FUNCTIONS for custom DOM manipulation.
       * must be in global scope
       **************************************** /
      function my_updateCallBack(record) {
        $('#viewbody').html(record.body);
      }
      function my_changeCallBack() {
        $('#wikiautosavebuttons').show();
        $('#wikiautosavebuttons .savebutton').show();
        $('#wikiautosavebuttons .savedbutton').hide();
      }
      function my_saveCallBack(record) {
        $('#viewbody').html(record.body);
        $('#wikiautosavebuttons .savebutton').hide();
        $('#wikiautosavebuttons .savedbutton').show();
      }
      $(document).ready(function() {
        CKEDITOR.plugins.addExternal( 'liveedit', '/modules/wiki/assets/ckeditorplugins/liveedit/','plugin.js','' );
        CKEDITOR.config.extraPlugins = 'liveedit';
      / *************************************************
       * GET AUTH TOKEN
       ************************************************* /
      $.ajax(
      	"/rest/token?apikey=<?php echo Config::get("system.rest_api_key") ?>",{cache: false,dataType: "json"}
      / *************************************************
       * NOW CREATE EDITOR
       ************************************************* /
      ).done(function(token) {
      	$('#body').each(function(){
      		CKEDITOR.replace(this,{
      			lastModified: '<?php echo $page->dt_modified ?>',
      			pollUrl: '/rest/index/WikiPage/id___equal/<?php echo $page->id; ?>/dt_modified___greater/',
      			saveUrl: '/rest/save/WikiPage/',
      			updateCallBack: 'my_updateCallBack',
      			changeCallBack: 'my_changeCallBack',
      			saveCallBack: 'my_saveCallBack',
      			saveTimeOut: 2000,
      			pollTimeOut: 3000,
      			requestParameters: 'token=' + token.success ,
      			saveData : {"id": "<?php echo $page->id ?>" }
      		});
      	});
      });
