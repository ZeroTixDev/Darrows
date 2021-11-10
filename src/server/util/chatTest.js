module.exports = function chatTest(string) {
   string = string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
   return /\S/.test(string) && string.length <= 60;
}