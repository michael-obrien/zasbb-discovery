//each subarray here contains a list of all services the referenced container
//will need to know about, e.g. most containers need access to 'directory' and
//server needs access to most containers


module.exports = {
  exposed: {
    '0': [1,2,3,4,5,9], //server
    '1': [], //directory
    '2': [1], //make post
    '3': [1], //get thread
    '4': [1], //get layout
    '5': [1], //get threadlist
    '9': [1] //get news
  },
  getServiceNumber: function (title) {
    //console.log(title);
    return {
      'Server': 0,
      'Directory': 1,
      'Make Post': 2,
      'Get Thread': 3,
      'Get Layout': 4,
      'Get Threadlist': 5,
      'Get News': 9
    }[title];
  }
};



//service number look-up - used to sort array index for container infos.
//function getServiceNumber(title) {
//  return {
//    'Server': 0,
//    'Directory': 1,
//    'Make Post': 2,
//    'Get Thread': 3,
//    'Get Layout': 4,
//    'Get Threadlist': 5,
//    'Get News': 9
//  }[title];
//}
