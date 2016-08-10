"use strict";

const errors = require('common-errors');

errors.FileNotUploaded = errors.helpers.generateClass("FileNotUploaded", {
	extends: errors.Error,
	globalize: true,
	args: ['inner_error'],
	generateMessage: function(){
		return "Не удалось загрузить файл";
	}
});

errors.FileTooBig = errors.helpers.generateClass("FileTooBig", {
	extends: errors.Error,
	globalize: true,
	args: ['maxSize','inner_error'],
	generateMessage: function(){
		return "Файл не должен быть больше " + this.maxSize;
	}
});

errors.FileType = errors.helpers.generateClass("FileType", {
	extends: errors.Error,
	globalize: true,
	args: ['type', 'types', 'inner_error'],
	generateMessage: function(){
		return "Данный тип файла ("+this.type+") запрещен для загрузки. Разрешенные типы: " + this.types;
	}
});

errors.FileTokenError = errors.helpers.generateClass("FileTokenError", {
	extends: errors.Error,
	globalize: true,
	args: ['inner_error'],
	generateMessage: function(){
		return "Подделка данных";
	}
});

errors.FileGetImageSize = errors.helpers.generateClass("FileGetImageSize", {
	extends: errors.Error,
	globalize: true,
	args: ['inner_error'],
	generateMessage: function(){
		return "Невозможно получить размеры изображения";
	}
});

errors.FileImageReSize = errors.helpers.generateClass("FileImageReSize", {
	extends: errors.Error,
	globalize: true,
	args: ['inner_error'],
	generateMessage: function(){
		return "Невозможно изменить размеры изображения";
	}
});

errors.DirEmpty = errors.helpers.generateClass("DirEmpty", {
	extends: errors.Error,
	globalize: true,
	args: ['dirPath', 'inner_error'],
	generateMessage: function(){
		return "пустая директория " + this.dirPath;
	}
});

errors.DirNotEmpty = errors.helpers.generateClass("DirNotEmpty", {
	extends: errors.Error,
	globalize: true,
	args: ['dirPath', 'inner_error'],
	generateMessage: function(){
		return "Не пустая директория " + this.dirPath;
	}
});

module.exports = errors;