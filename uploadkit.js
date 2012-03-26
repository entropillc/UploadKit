var UKEventType = {
  FileUploaded: 'UKFileUploaded',
  UploadComplete: 'UKUploadComplete',
  UploadError: 'UKUploadError'
};

var UploadKit = function(input) {
  if (!window['plupload']) {
    console.error('Unable to initialize UploadKit; Plupload dependency not found');
    return null;
  }
  
  var $input = $(input);
  var $form = $input.closest('form');
  
  var id = (Date['now']) ? Date.now() : +new Date(); // TODO: Verify this failover works in IE.
  var baseUrl = '';
  $('script').each(function(index, element) {
    var src = $(element).attr('src') || '';
    var endIndex = src.indexOf('uploadkit.js');
    if (endIndex !== -1) baseUrl = (endIndex === 0) ? './' : src.substring(0, endIndex);
  });
  
  var self = this;
  var name = this.name = $input.attr('name');  
  var isMultiple = this.isMultiple = !!$input.attr('multiple');
  var uploadUrl = this.uploadUrl = $input.data('uploadUrl') || $form.attr('action');
  var maxFileSize = this.maxFileSize = $input.data('maxFileSize') || this.maxFileSize;
  var classes = ($input.attr('class') + '').replace(/uk-input/g, '');
  
  var $element = this.$element = $input.wrap('<div id="uk-container-' + id + '" class="uk-container ' + classes + '"/>').parent();
  $element.data('uploadKit', this);
  $input.data('uploadKit', this);
  $input.attr('disabled', true);
  
  var infoHtml = (isMultiple) ?
    '<h1>No Files Selected</h1><h2>Browse for files to upload or drag and drop them here</h2>' :
    '<h1>No File Selected</h1><h2>Browse for file to upload or drag and drop it here</h2>';
  
  var $info = this.$info = $('<div class="uk-info"/>').html(infoHtml).appendTo($element);
  var $table = this.$table = $('<table class="table table-condensed"/>').appendTo($element).hide();
  var $thead = this.$thead = $('<thead/>').html('<tr><th/><th/><th>File Name</th><th>Size</th><th>Progress</th></tr>').appendTo($table);
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
  
  var responses = this.responses = [];
  
  uploader.bind('Init', function(uploader, params) {
    console.log('Initialized UploadKit uploader with ' + params.runtime + ' runtime');
  });
  
  uploader.bind('FilesAdded', function(uploader, files) {
    $info.hide();
    $table.show();
    $uploadButton.removeClass('disabled').show();
    
    var newFiles = files;
    
    if (!isMultiple) {
      var existingFiles = uploader.files;
      
      if (existingFiles.length > 0) uploader.removeFile(existingFiles[0]);
      if (files.length > 0) newFiles = [files[0]];
      
      $tbody.children('tr.error').remove();
    }
    
    for (var i = 0, length = newFiles.length; i < length; i++) {
      $tbody.append('<tr id="' + newFiles[i].id + '">' +
        '<td class="uk-close-column"><a class="close" title="Remove" href="#">&times;</a></td>' +
        '<td class="uk-icon-column"><i class="icon-file"/></td>' +
        '<td>' + newFiles[i].name + '</td>' +
        '<td class="uk-size-column">' + plupload.formatSize(newFiles[i].size) + '</td>' +
        '<td class="uk-progress-column">' +
          '<div class="progress progress-info progress-striped active">' +
            '<div class="bar"/>' +
          '</div>' +
        '</td>' +
      '</tr>');
    }
  });
  
  uploader.bind('FilesRemoved', function(uploader, files) {
    var removedFiles = files;
    
    for (var i = 0, length = removedFiles.length; i < length; i++) {
      $tbody.children('#' + removedFiles[i].id).remove();
    }
  });
  
  uploader.bind('BeforeUpload', function(uploader, file) {
    var multipartParams = {};
    var fields = $form.serializeArray();
    
    for (var i = 0, length = fields.length; i < length; i++) {
      var field = fields[i];
      var fieldName = field.name;
      
      if (fieldName) multipartParams[fieldName] = field.value;
    }
    
    uploader.settings.multipart_params = multipartParams;
  });
  
  uploader.bind('UploadProgress', function(uploader, file) {
    var $tr = $tbody.find('#' + file.id);
    var $bar = $tr.find('.bar');
    $bar.css('width', file.percent + '%');
  });
  
  uploader.bind('FileUploaded', function(uploader, file, response) {
    var $tr = $tbody.find('#' + file.id);
    var $progress = $tr.find('.progress');
    var $bar = $progress.find('.bar');
    
    $progress.removeClass('progress-info active').addClass('progress-success');
    $bar.html('Done');
    
    responses.push(response);
    
    $input.trigger($.Event(UKEventType.FileUploaded, {
      uploader: uploader,
      file: file,
      response: response
    }));
  });
  
  uploader.bind('UploadComplete', function(uploader, files) {
    $input.trigger($.Event(UKEventType.UploadComplete, {
      uploader: uploader,
      files: files,
      responses: responses
    }));
  });
  
  uploader.bind('Error', function(uploader, error) {
    var $tr = $tbody.find('#' + error.file.id).addClass('error');
    var $td = $tr.children('.uk-progress-column');
    var message;
    
    switch (error.code) {
      case -600:
        message = 'File size exceeds limit';
        break;
      default:
        message = 'Unknown error occurred';
        break;
    }
    
    $td.html(message);
    
    if (uploader.files.length === 0) $uploadButton.addClass('disabled');
    
    $input.trigger($.Event(UKEventType.UploadError, {
      uploader: uploader,
      error: error
    }));
  });
  
  $tbody.delegate('a.close', 'click', function(evt) {
    var $this = $(this);
    var $tr = $this.closest('tr');
    var id = $tr.attr('id');
    var file = uploader.getFile(id);
    
    if (uploader.files.length <= 1) {
      $info.show();
      $table.hide();
      $browseButton.show();
      $uploadButton.hide();
    }
    
    if (file) {
      uploader.removeFile(file);
    } else {
      $tr.remove();
    }
    
    evt.preventDefault();
  });
  
  $uploadButton.bind('click', function(evt) {
    if ($uploadButton.hasClass('disabled')) return false;
    
    $uploadButton.addClass('disabled');
    
    responses = self.responses = [];
    
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
  uploader: null,
  responses: null
};

$(function() {
  var $inputs = $('input.uk-input[type="file"]');
  
  $inputs.each(function(index, element) {
    new UploadKit(element);
  });
});
