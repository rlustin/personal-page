'use strict';

var locales = {
  'en': {
    'day': 'day',
    'month': 'month',
    'year': 'year',
    'and': 'and'
  },
  'fr': {
    'day': 'jour',
    'month': 'mois',
    'year': 'an',
    'and': 'et'
  },
};

String.prototype.pluralize = function(count) {
  if (this.slice(-1) === 's') {
    var plural = this;
  } else {
    var plural = this + 's';
  }

  return (count === 1 ? this : plural) ;
};

function dateSince(year, month, day, locale) {
  var date = new Date(year, month - 1, day),
      diff = Math.floor((new Date()).getTime() - date.getTime()),
      dayInSec = 1000 * 60 * 60 * 24,
      monthInSec = dayInSec * 30,
      yearInSec = dayInSec * 365,
      years = Math.floor(diff / yearInSec),
      months = Math.floor((diff - years * yearInSec) / monthInSec);

  if (years === 0) {
    return months + ' ' + locales[locale].month.pluralize(months);
  }

  if (months === 0) {
    return years + locales[locale].year.pluralize(years);
  }

  return years + ' ' + locales[locale].year.pluralize(years) + ' '
           + locales[locale].and + ' ' + months + ' '
           + locales[locale].month.pluralize(months);
}

$('.date-since').each(function () {
  $(this).html(dateSince(
    $(this).data('year'),
    $(this).data('month'),
    $(this).data('day'),
    $(this).data('locale')
  ));
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
