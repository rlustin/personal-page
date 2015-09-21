'use strict';

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
