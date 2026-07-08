window.handleCommentFileChange = function(input, id) {
  const fileInfo = document.getElementById(`reply-file-info-${id}`);
  if (fileInfo) {
    const files = input.files;
    if (files.length > 0) {
      fileInfo.textContent = `Đã chọn ${files.length} file`;
    } else {
      fileInfo.textContent = '';
    }
  }
};
