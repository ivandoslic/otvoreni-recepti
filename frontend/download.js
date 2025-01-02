function downloadData(format) {
  const url = `/api/data.${format}`; // Replace with your backend endpoint
  const link = document.createElement("a");
  link.href = url;
  link.download = `data.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
