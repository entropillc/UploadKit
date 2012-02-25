var UploadKit = function(input) {
  if (!window['plupload']) {
    console.error('Unable to initialize UploadKit; Plupload dependency not found');
    return null;
  }
  
  var $input = $(input);
  
  var id = (Date['now']) ? Date.now() : +new Date(); // TODO: Verify this failover works in IE.
  var baseUrl = '';
  $('script').each(function(index, element) {
    var src = $(element).attr('src');
    var endIndex = src.indexOf('uploadkit.js');
    if (endIndex !== -1) baseUrl = (endIndex === 0) ? './' : src.substring(0, endIndex);
  });
  
  var name = this.name = $input.attr('name');  
  var isMultiple = this.isMultiple = !!$input.attr('multiple');
  var uploadUrl = this.uploadUrl = $input.data('uploadUrl');
  var maxFileSize = this.maxFileSize = $input.data('maxFileSize') || this.maxFileSize;
  
  var $element = this.$element = $input.wrap('<div id="uk-container-' + id + '" class="uk-container span6"/>').parent();
  $element.data('uploadKit', this);
  $input.remove();
  
  var infoHtml = (isMultiple) ?
    '<h1>No Files Selected</h1><h2>Browse for files to upload or drag and drop them here</h2>' :
    '<h1>No File Selected</h1><h2>Browse for file to upload or drag and drop it here</h2>';
  
  var $info = this.$info = $('<div class="uk-info"/>').html(infoHtml).appendTo($element);
  var $table = this.$table = $('<table class="table table-condensed"/>').appendTo($element).hide();
  var $thead = this.$thead = $('<thead/>').html('<tr><th/><th>File Name</th><th>Size</th><th>Progress</th></tr>').appendTo($table);
  var $tbody = this.$tbody = $('<tbody/>').appendTo($table);
  var $browseButton = this.$browseButton = $('<a id="uk-browse-button-' + id + '" class="btn" href="#"/>').html('<i class="icon-file"/>Browse...').appendTo($element);
  var $uploadButton = this.$uploadButton = $('<a id="uk-upload-button-' + id + '" class="btn btn-primary" href="#"/>').html('<i class="icon-upload icon-white"/>Upload').appendTo($element).hide();
  
  var uploader = this.uploader = new plupload.Uploader({
    runtimes: 'html5,flash,silverlight,gears,browserplus,html4',
    container: 'uk-container-' + id,
    drop_element: 'uk-container-' + id,
    browse_button: 'uk-browse-button-' + id,
    file_data_name: name,
    multi_selection: isMultiple,
    url: uploadUrl,
    max_file_size: maxFileSize,
    flash_swf_url: baseUrl + 'externals/plupload/js/plupload.flash.swf',
    silverlight_xap_url: baseUrl + 'externals/plupload/js/plupload.silverlight.xap',
    filters: []
  });
  
  uploader.bind('Init', function(up, params) {
    console.log('Initialized UploadKit uploader with ' + params.runtime + ' runtime');
  });
  
  uploader.bind('FilesAdded', function(up, files) {
    $info.hide();
    $table.show();
    $uploadButton.show();
    
    for (var i = 0, length = files.length; i < length; i++) {
      $tbody.append('<tr id="' + files[i].id + '">' +
        '<td><i class="icon-file"/></td>' +
        '<td>' + files[i].name + '</td>' +
        '<td class="uk-size-column">' + plupload.formatSize(files[i].size) + '</td>' +
        '<td class="uk-progress-column">' +
          '<div class="progress progress-info progress-striped active">' +
            '<div class="bar"/>' +
          '</div>' +
        '</td>' +
      '</tr>');
    }
  });
  
  uploader.bind('UploadProgress', function(up, file) {
    var $tr = $tbody.find('#' + file.id);
    var $bar = $tr.find('.bar');
    $bar.css('width', file.percent + '%');
  });
  
  uploader.bind('FileUploaded', function(up, file) {
    var $tr = $tbody.find('#' + file.id);
    var $progress = $tr.find('.progress');
    var $bar = $progress.find('.bar');
    $progress.removeClass('progress-info active').addClass('progress-success');
    $bar.html('Done');
  });
  
  uploader.bind('Error', function(up, err) {
    var $tr = $tbody.find('#' + err.file.id);
    var $progress = $tr.find('.progress');
    var $bar = $progress.find('.bar');
    $progress.removeClass('progress-info active').addClass('progress-danger');
    $bar.html('Error');
  });
  
  $uploadButton.bind('click', function(evt) {
    uploader.start();
    evt.preventDefault();
  });
  
  uploader.init();
};

UploadKit.prototype = {
  $element: null,
  $info: null,
  $table: null,
  $thead: null,
  $tbody: null,
  $browseButton: null,
  $uploadButton: null,
  name: null,
  isMultiple: false,
  uploadUrl: null,
  maxFileSize: '10mb',
  uploader: null
};

$(function() {
  var $inputs = $('input.uk-input[type="file"]');
  
  $inputs.each(function(index, element) {
    new UploadKit(element);
  });
});
