/* DashBack Bookmark - Landing Page
 * Copyright (C) HYPE Industries Cloud Division - All Rights Reserved (HYPE-MMD)
 * Dissemination of this information or reproduction of this material is strictly forbidden unless prior written permission is obtained from HYPE Industries.
 */

var shuffle = function (array) {
  var currentIndex = array.length;
  var temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

var options = {
  strings: shuffle( ['<b>Remember that</b> website for your school project?', "<b>Remember that</b> form for sick days?", "<b>Remember that</b> news article you wanted to read?", "<b>Remember that</b> birthday present idea for Dad?", "<b>Remember that</b> project idea you found earlier?", '<b>Remember that</b> image you wanted for the site?', "<b>Remember that</b> Youtube video?", "<b>Remember that</b> thing on Amazon you wanted?", "<b>Remember that</b> research paper you saw?", "<b>Remember that</b> restaurant you wanted to visit?", "<b>Remember that</b> story you wanted to read?", "<b>Remember that</b> email you needed?", "<b>Remember that</b> website you need for research?", "<b>Remember that</b> cool project you wanted to make?", "<b>Remember that</b> code snippet you wanted?"  ] ),
  typeSpeed: 80,
  backSpeed: 80,
  backDelay: 1000,
  smartBackspace: true,
  loop: true,
  loopCount: Infinity,
};

var typed = new Typed('.type-place', options);
