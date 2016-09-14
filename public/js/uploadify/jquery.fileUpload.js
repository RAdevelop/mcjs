(function($) {
	$.fn.fileUpload = function(params, uploadBtn)
	{
		/* значение по умолчанию */
		var defaults = {
			"debug": 1,
			"auto": true,
			"multiUpload": true,
			"fileSizeLimit": '1MB',//по умолчанию
			"removeCompleted": true,
			"formData": {},
			"width": 145,
			"height": 40,
			"buttonClass": 'btn btn-primary',
			"onSuccess": function(data) {},
			"onStart": function() {}, //когда началась загрузка
			"onEnd": function() {} //когда завершилась загрузка или прервалась
		};

		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var settings = $.extend({}, defaults, params);
		/**/

		var $fileUpload = $(this);

		if(!params)
		{
			console.log('нет настроект для Uploadify');
			$fileUpload.hide();
			return $fileUpload;
		}

		var $uploadBtn = $fileUpload.find(uploadBtn);

		//сохраним сюда список файлов, коотрые не загрузились
		var  notUploadedFiles = {};

		//сохраним сюда список файлов, коотрые загрузились
		var uploadedFiles = {};

		function winFileReader()
		{
			return (window.File && window.FileReader);
			return false;
		}

		function getFormData()
		{
			var formData = {};
			$.each( $( $fileUpload.selector ).parents('form').serializeArray() , function (indx, item)
			{
				formData[item["name"]] = item["value"];
			});

			return formData;
		}

		function getFileTypes(types, type)
		{
			if (!types.length) return [];


			if (winFileReader())
			{
				types = types.map(function(item){return type+'\/'+item;});
				//types = types.join(';');
			}
			else
			{
				types = types.map(function(item){return '*.'+item;});
				types = types.join('; ');
			}

			return types;
		}

		function onFileTooBig(file)
		{
			if (!file) return;

			file["reason"] = 'Объем файла '+(file["name"] ? file["name"]+' ' : '')+'превышает допустимые ' +settings.maxFileSize +'Mb';

			saveNotUploadedFile(file);
			removeFileFromQueueData(file);
		}

		function onForbiddenFileType(file)
		{
			if (!file) return;

			var types =  (winFileReader() ? settings.fileType : settings.fileTypeExts);
			file["reason"] = 'Тип файла '+(file["name"] ? file["name"]+' ' : '')+'запрещен для загрузки.<br/> ' +
				'Разрешенные типы файлов: ' + types;

			saveNotUploadedFile(file);
			removeFileFromQueueData(file);
		}

		function onServerFileError(file)
		{
			if (!file) return;

			file["reason"] = 'Ошибка в загурзке файла '+file["name"]+'.<br/>' +
				'Обновите страницу, и повторите попытку.';

			saveNotUploadedFile(file);
			removeFileFromQueueData(file);
		}

		function onQueueLimitExceeded()
		{
			mcDialog('Одновременно можно загружать не более '+settings.queueSizeLimit+' файлов.', true);
		}

		function onLimitExceeded(file, text)
		{
			file["reason"] = file["name"]+' '+text;

			saveNotUploadedFile(file);
			removeFileFromQueueData(file);
			//mcDialog(text, true);
		}

		function mcDialogSelector()
		{
			var s = '_'+$fileUpload.selector.replace(/\s+/gi, '');
			return s.replace(/#+/gi, '_');
		}

		function mcDialog(message, error)
		{
			var errorTitle = (error ? 'Следующие файлы не были загружены' : 'Загрузка успешно завершена');
			$( mcDialogSelector() ).mcDialog({
				title: errorTitle
				, body: message
				, postRes: !error
			});
		}

		/**
		 * удаляем данные о файле из очереди. иначе будут всякие алерты с предупреждениями...
		 * @param file
		 */
		function removeFileFromQueueData(file)
		{
			if (winFileReader())
			{
				//uploadifive
				if (file)
					$fileUpload.uploadifive('cancel', file);
			}
			else
			{
				//for uploadify
				if (file && $fileUpload.data('uploadify').queueData.files[file["id"]])
				{
					delete $fileUpload.data('uploadify').queueData.files[file["id"]];

					if ($fileUpload.data('uploadify').queueData.filesQueued > 0)
						$fileUpload.data('uploadify').queueData.filesQueued--;

					if ($fileUpload.data('uploadify').queueData.filesSelected > 0)
						$fileUpload.data('uploadify').queueData.filesSelected--;

					if ($fileUpload.data('uploadify').queueData.filesErrored > 0)
						$fileUpload.data('uploadify').queueData.filesErrored--;

					if ($fileUpload.data('uploadify').queueData.uploadsSuccessful > 0)
						$fileUpload.data('uploadify').queueData.uploadsSuccessful--;

					if ($fileUpload.data('uploadify').queueData.queueBytesUploaded > 0)
						$fileUpload.data('uploadify').queueData.queueBytesUploaded -= file["size"];

					if ($fileUpload.data('uploadify').queueData.uploadSize > 0)
						$fileUpload.data('uploadify').queueData.uploadSize -= file["size"];
				}
				else if (!file)
				{
					$fileUpload.data('uploadify').queueData = {
						files: {}, // The files in the queue
						filesSelected: 0, // The number of files selected in the last select operation
						filesQueued: 0, // The number of files added to the queue in the last select operation
						filesReplaced: 0, // The number of files replaced in the last select operation
						filesCancelled: 0, // The number of files that were cancelled instead of replaced
						filesErrored: 0, // The number of files that caused error in the last select operation
						uploadsSuccessful: 0, // The number of files that were successfully uploaded
						uploadsErrored: 0, // The number of files that returned errors during upload
						averageSpeed: 0, // The average speed of the uploads in KB
						queueLength: 0, // The number of files in the queue
						queueSize: 0, // The size in bytes of the entire queue
						uploadSize: 0, // The size in bytes of the upload queue
						queueBytesUploaded: 0, // The size in bytes that have been uploaded for the current upload queue
						uploadQueue: [], // The files currently to be uploaded
						errorMsg: 'Some files were not added to the queue:'
					};
				}
			}
		}

		/**
		 *
		 * @param file - json данные
		 * @param fileData - json данные
		 */
		function saveUploadedFile(file, fileData)
		{
			uploadedFiles[file["name"]] = fileData;
		}

		/**
		 *
		 * @param file - json данные
		 */
		function saveNotUploadedFile(file)
		{
			notUploadedFiles[file["name"]] = file;
		}

		function getNotUploadedFiles()
		{
			return notUploadedFiles;
		}

		var timerResultFilesUpload = null;
		function clearTimerResultFilesUpload()
		{
			clearTimeout(timerResultFilesUpload);
			timerResultFilesUpload = null;
		}

		function resultFilesUpload()
		{
			timerResultFilesUpload = setTimeout(function show()
			{
				var notUploadedFile = getNotUploadedFiles();
				var message= [];
				//console.log(notUploadedFile);

				for (var f in notUploadedFile)
				{
					if (notUploadedFile.hasOwnProperty(f) && notUploadedFile[f].hasOwnProperty("reason"))
						message.push('<li>'+notUploadedFile[f]["reason"]+'</li>');
				}
				notUploadedFiles = {};

				if (message.length > 0)
					mcDialog('<ul>'+message.join('')+'</ul>', true);
				else
					clearTimerResultFilesUpload();

				var files = [];
				for (var fn in uploadedFiles)
				{
					if (uploadedFiles.hasOwnProperty(fn))
					files.push(uploadedFiles[fn]);
				}

				uploadedFiles = {};

				if (typeof settings.onEnd === 'function')
				{
					$fileUpload.data("uploadFileData", files);
					(settings.onEnd).apply($fileUpload);
					$fileUpload.data("uploadFileData", []);
				}

			}, 500);
		}


		settings.multi = settings.multiUpload;
		settings.buttonText = 'выберите файл' +(settings.multiUpload ? 'ы':'');

		settings.queueSizeLimit = (settings.multi ? 5 : 1);
		settings.uploadLimit    = 999;
		settings.successTimeout = 120; //sec

		if (winFileReader())//uploadifive
		{
			settings.uploadScript = $fileUpload.parents('form').attr('action');
			settings.fileType = getFileTypes(settings.fileTypes, settings.fileMediaType);
			settings.simUploadLimit = 10;


			/*
			 settings.itemTemplate = '<div id="${fileID}" class="uploadifive-queue-item">' +
			 '<span class="filename">${fileName} (${fileSize})</span> | <button type="button" class="btn btn-danger btn-xs" onclick="$(\'#${instanceID}\').uploadify(\'cancel\', \'${fileID}\');">отменить</button>' +
			 '<div class="progress" style="display: none;">' +
			 '<div class="progress-bar progress-bar-striped active" role="progressbar" style="width: 0%;"><span class=" fileinfo "></span></div>' +
			 '</div>' +
			 '</div>';
			 */

			$(document).on('click', '.uploadifive-queue-item .cancel', function (event)
			{
				$fileUpload.uploadifive('cancel', $(this).parent().data('file'));
			});

			settings.itemTemplate = '<div class="uploadifive-queue-item">' +
				'<span class="filename"></span> |  <button type="button" class="btn btn-danger btn-xs cancel">отменить</button>' +
				'<div class="progress" style="display: none;">' +
				'<div class="progress-bar progress-bar-striped active" role="progressbar" style="width: 0;"><span class=" fileinfo "></span></div>' +
				'</div>' +
				'</div>';
			settings.overrideEvents = ["onError","onSelect","onUpload","onProgress","onUploadFile","onQueueComplete","onUploadComplete"];

			settings.onInit = function()
			{
				//console.log("$fileUpload.data('uploadifive').settings");
				//console.log($fileUpload.data('uploadifive').settings);
			};

			//Triggered once for every file that is selected whether it returns and error or not
			settings.onSelect = function(queue)
			{
				console.log("----------");
				console.log("uploadifive onSelect");

				console.log(queue);

				console.log("END uploadifive onSelect");
				console.log("----------");
			};

			//Triggered once during an upload operation that was called with the upload method
			settings.onUpload = function (file)
			{
				console.log("----------");
				console.log("uploadifive onUpload");
				console.log('' + file + ' files will be uploaded.');

				var formData = getFormData();

				for (var i in formData)
				{
					if (formData.hasOwnProperty(i))
					$fileUpload.data('uploadifive').settings.formData[i] = formData[i];
				}

				settings.onStart.apply($fileUpload);

				if (file == 0)
					settings.onEnd.apply($fileUpload);

				console.log("uploadifive onUpload");
				console.log("----------");
			};

			//Triggered once for every file upload that starts.
			settings.onUploadFile = function (file)
			{
				console.log("----------");
				console.log("uploadifive onUploadFile");
				console.log(file);

				clearTimerResultFilesUpload();

				console.log("END uploadifive onUploadFile");
				console.log("----------");
			};

			settings.onError = function (errorType, file)
			{
				console.log("----------");
				console.log("uploadifive onError");
				console.log(file);

				//if (file)
				//saveNotUploadedFile(file);

				switch (errorType)
				{
					case "FILE_SIZE_LIMIT_EXCEEDED":
						onFileTooBig(file);
						break;
					case "FORBIDDEN_FILE_TYPE":
						onForbiddenFileType(file);
						break;
					case "QUEUE_LIMIT_EXCEEDED":
						onQueueLimitExceeded(file);
						break;
					default:
						console.log(errorType); //TODO
						mcDialog('Повторите попытку позже. TODO: ' + errorType, true);

						break;
				}

				resultFilesUpload();

				console.log("END uploadifive onError");
				console.log("----------");
			};
			settings.onProgress = function (file, e)
			{
				console.log("----------");
				console.log("uploadifive onProgress");

				clearTimerResultFilesUpload();

				var percent = Math.round((e.loaded / e.total) * 100);

				file.queueItem.find('.progress').show();
				file.queueItem.find('.fileinfo').html(percent + '%');
				file.queueItem.find('.progress-bar').css('width', percent + '%');

				console.log("END uploadifive onProgress");
				console.log("----------");
			};

			//Triggered once for each file upload that completes
			settings.onUploadComplete = function (file, data)
			{
				console.log('uploadifive onUploadComplete');

				console.log('-----------uploadifive data------------------');
				console.log($fileUpload.data('uploadifive'));
				console.log('-----------uploadifive data------------------');

				console.log(data);
				console.log(file);

				file.queueItem.hide();
				data = $.parseJSON(data);

				if (data.hasOwnProperty("formError") && data["formError"]["error"])//ошибка при загрузке
				{
					$fileUpload.uploadifive('cancel', file);

					switch (data["formError"]["errorName"])
					{
						case "FileTooBig":
							onFileTooBig(file);
							break;

						case "FileType":
							onForbiddenFileType(file);
							break;

						case "LimitExceeded":
							onLimitExceeded(file, data["formError"]["text"]);
							break;

						default:
							onServerFileError(file);
							break;
					}
				}
				else
				{
					saveUploadedFile(file, data);
					if (typeof settings.onSuccess === 'function')
						settings.onSuccess.apply($fileUpload);
				}
				//removeFileFromQueueData(file);//!!!!important  ????????

				resultFilesUpload();
				console.log('END uploadifive onUploadComplete');
			};

			settings.onQueueComplete = function(uploads)
			{
				console.log('uploadifive onQueueComplete');
				resultFilesUpload();

				console.log('END uploadifive onQueueComplete');
			};


			$fileUpload.uploadifive(settings);
		}
		else//uploadify
		{
			settings.itemTemplate = '<div id="${fileID}" class="uploadifive-queue-item">' +
			'<span class="filename">${fileName} (${fileSize})</span> | <button type="button" class="btn btn-danger btn-xs" onclick="$(\'#${instanceID}\').uploadify(\'cancel\', \'${fileID}\');">отменить</button>' +
				'<div class="progress" style="display: none;">' +
				'<div class="progress-bar progress-bar-striped active" role="progressbar" style="width: 0;"><span class=" fileinfo "></span></div>' +
				'</div>' +
			'</div>';

			settings.swf  = '/js/uploadify/uploadify.swf';
			settings.removeTimeout  = 0.1;//кол-во секунд, через которое скроется завершенный процесс каждой загрузки
			settings.uploader = $fileUpload.parents('form').attr('action');
			settings.fileTypeExts = getFileTypes(settings.fileTypes, settings.fileMediaType);
			settings.cancelImg = '/js/uploadify/uploadify-cancel.png';

			settings.overrideEvents = ["onDialogOpen", "onDialogClose", "onSelectError","onUploadSuccess","onUploadProgress","onUploadStart","onQueueComplete","onUploadError"];

			settings.onInit = function(instance)
			{
				//instance.settings.formData = getFormData();
			};

			/**
			 * влияет на появление прогресс бара. если добавить в settings.overrideEvents
			 * то появление прогресс-бара надо реализовывать самому
			 *
			 * @param file
			 */
			settings.onSelect = function(file)
			{
				console.log('The file ' + file.name + ' was added to the queue.');
			};

			settings.onCancel = function(file)
			{
				console.log('uploadify onCancel');
				removeFileFromQueueData(file);//!!!!important
			};

			settings.onClearQueue = function(queueItemCount)
			{
				removeFileFromQueueData();
				console.log('uploadify onClearQueue');
				console.log(queueItemCount + ' file(s) were removed from the queue');
				/*console.log('-----------onClearQueue------------------');
				console.log($fileUpload.data('uploadify'));
				console.log('-----------onClearQueue------------------');*/
			};

			settings.onUploadStart = function(file)
			{
				console.log('uploadify onUploadStart');

				clearTimerResultFilesUpload();

				console.log(file);

				var formData = getFormData();

				for(var i in formData)
				{
					if (!formData.hasOwnProperty(i)) continue;
					
					var item = {};
					item[i] = formData[i];
					$fileUpload.uploadify("settings", "formData", item);
				}

				console.log($fileUpload.uploadify("settings", "formData"));
				console.log('');
				settings.onStart.apply($fileUpload);
			};

			settings.onUploadSuccess = function(file, data, response)
			{
				console.log('uploadify onUploadSuccess');
				console.log('file');
				console.log(file);
				console.log('data');
				console.log(data);
				console.log('response');
				console.log(response);
				console.log('');

				/*
				TODO обработать data если там ошибка, то попробовать написать метод, который прервет загрузку остальных (следующих)
				файлов.
				см
				для uploadifive
				 http://www.uploadify.com/documentation/uploadifive/cancel-2/
				 и
				 http://www.uploadify.com/documentation/uploadifive/clearqueue/

				 для uploadify
				 http://www.uploadify.com/documentation/uploadify/stop/
				 */

				//$fileUpload.uploadify('cancel','*');

				data = $.parseJSON(data);

				if (data.hasOwnProperty("formError") && data["formError"]["error"])//ошибка при загрузке
				{
					if (settings.multi)
					{
						$fileUpload.uploadify('cancel', file["id"]);
					}
					else
					{
						$fileUpload.uploadify('cancel', file["id"]);
						//$fileUpload.uploadify('cancel','*');
					}
					console.log(data);
					switch (data["formError"]["errorName"])
					{
						case "FileTooBig":
							onFileTooBig(file);
							break;

						case "FileType":
							onForbiddenFileType(file);
							break;

						default:
							onServerFileError(file);
							break;

					}
				}
				else
				{
					saveUploadedFile(file, data);
					if (typeof settings.onSuccess === 'function')
					settings.onSuccess.apply($fileUpload);
				}
				removeFileFromQueueData(file);//!!!!important

				/*console.log('-----------onUploadSuccess------------------');
				console.log($fileUpload.data('uploadify'));
				console.log('-----------onUploadSuccess------------------');*/
			};
			settings.onUploadError = function(file, errorCode, errorMsg, errorString)
			{
				console.log('uploadify onUploadError');
				console.log('file');
				console.log(file);
				console.log('errorCode = ' + errorCode);
				console.log('errorMsg = ' + errorMsg);
				console.log('errorString = ' + errorString);
				console.log('');
				saveNotUploadedFile(file);
				removeFileFromQueueData(file);
				console.log('END uploadify onUploadError');
			};
			settings.onUploadComplete = function(file)
			{
				console.log('uploadify onUploadComplete');
				console.log(file);
				console.log('');

				removeFileFromQueueData(file);

				console.log('END uploadify onUploadComplete');
			};
			settings.onUploadProgress = function(file, bytesUploaded, bytesTotal, totalBytesUploaded, totalBytesTotal)
			{
				console.log('uploadify onUploadProgress');
				console.log(file);

				var $item = $('#'+file["id"]);

				$item.find('.progress').show();
				clearTimerResultFilesUpload();

				//var percent = Math.round((totalBytesUploaded / totalBytesTotal) * 100);
				var percent = Math.round((bytesUploaded / bytesTotal) * 100);
				//$('#progress').html(totalBytesUploaded + ' bytes uploaded of ' + totalBytesTotal + ' bytes.');


					$item.find('.fileinfo').html(percent + '%');
					$item.find('.progress-bar').css('width', percent+ '%');
				console.log('END uploadify onUploadProgress');
			};
			settings.onDialogOpen = function(file, errorCode, errorMsg)
			{
				console.log('uploadify onDialogOpen');
				console.log('END uploadify onDialogOpen');
			};
			settings.onDialogClose = function(queueData)
			{
				console.log('uploadify onDialogClose');
				console.log(queueData);
				console.log(getNotUploadedFiles());

				resultFilesUpload();

				console.log('END uploadify onDialogClose');
			};
			settings.onSelectError = function(file, errorCode, errorMsg)
			{
				console.log('uploadify onSelectError');

				console.log('-----------onSelectError------------------');
				 console.log($fileUpload.data('uploadify'));
				 console.log('-----------onSelectError------------------');

				console.log('file');
				console.log(file);
				console.log('');
				console.log('errorCode');
				console.log(errorCode);
				console.log('errorMsg');
				console.log(errorMsg);

				removeFileFromQueueData(file);

				switch(errorCode)
				{
					case -110:
						onFileTooBig(file);
						break;

					case -100:
						onQueueSizeLimit();
						break;

					default:

						mcDialog('Повторите попытку позже.', true);

						break;
				}
				console.log('END uploadify onSelectError');
			};

			settings.onQueueComplete = function(queueData)
			{
				console.log('uploadify onQueueComplete');
				console.log(queueData);

				/*setTimeout(function ()
				{
					var files = [];
					for (var fn in uploadedFiles)
					{
						files.push(uploadedFiles[fn]);
					}

					if (typeof settings.onEnd === 'function')
					{
						$fileUpload.data("uploadFileData", files);
						(settings.onEnd).apply($fileUpload);
						$fileUpload.data("uploadFileData", []);
					}
					removeFileFromQueueData();
					resultFilesUpload();
					uploadedFiles = {};


					console.log('-----------onQueueComplete------------------');
					 console.log($fileUpload.data('uploadify'));
					 console.log('-----------onQueueComplete------------------');

				}, 100);*/
				resultFilesUpload();
				console.log('END uploadify onQueueComplete');
			};

			$fileUpload.uploadify(settings);
		}

		if (winFileReader() && $uploadBtn.size())
		{
			$(document).on('click', $uploadBtn, function () {
				$fileUpload.uploadifive('upload');
			});
		}
		else if ($uploadBtn.size())
		{
			$(document).on('click', $uploadBtn, function () {
				$fileUpload.uploadify('upload');
			});
		}
	}
})(jQuery);