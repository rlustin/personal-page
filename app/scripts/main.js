'use strict';

function timeSince(year, month, day) {
  var date = new Date(year, month - 1, day);
  var diff = Math.floor((new Date()).getTime() - date.getTime());
  var dayInSec = 1000 * 60 * 60 * 24;
  var monthInSec = dayInSec * 30;
  var yearInSec = dayInSec * 365;

  var years = Math.floor(diff / yearInSec);
  var months = Math.floor((diff - years * yearInSec) / monthInSec);

  if (years === 0) {
    return months + ' mois';
  }
  var yearString = years > 1 ? ' ans' : ' an';
  if (months === 0) {
    return years + yearString;
  }

  return years + yearString + ' et ' + months + ' mois';
}

$('.date-since').each(function () {
  $(this).html('(' + timeSince($(this).data('year'), $(this).data('month'), $(this).data('day')) + ')');
});

$('.nav a[href^="#"]').click(function () {
  $('.navbar-toggle').click();
  $('html, body').animate({
    scrollTop: $($(this).attr('href')).offset().top - 65
  }, 'fast');

  return false;
});

$('footer a[href^="#"]').click(function () {
  $('html, body').animate({
    scrollTop: $($(this).attr('href')).offset().top
  }, 'fast');

  return false;
});
