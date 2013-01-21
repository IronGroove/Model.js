function objectSize(obj) {
  var size = 0;
  for (var k in obj) if (obj.hasOwnProperty(k)) size ++;
  return size;
}

function objectKeys(obj) {
  var keys = [];
  for (var k in obj) keys.push(k);
  return keys;
}
