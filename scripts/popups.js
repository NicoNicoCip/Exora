document.addEventListener("DOMContentLoaded", () => {
  const popContact = document.getElementById('pop-contact');
  const popPrivacy = document.getElementById('pop-privacy');
  const popLegal = document.getElementById('pop-legal');
  const popCookie = document.getElementById('pop-cookie');

  document.getElementById('pop-contact-btn')
    .addEventListener('click', () => {
      popContact.show();
    });

  document.getElementById('pop-privacy-btn')
    .addEventListener('click', () => {
      popPrivacy.show();
    });

  document.getElementById('pop-legal-btn')
    .addEventListener('click', () => {
      popLegal.show();
    });

  document.getElementById('pop-cookie-btn')
    .addEventListener('click', () => {
      popCookie.show();
    });

  popContact.addEventListener('popup-close', () => {
    popContact.hide();
  });

  popPrivacy.addEventListener('popup-close', () => {
    popPrivacy.hide();
  });

  popLegal.addEventListener('popup-close', () => {
    popLegal.hide();
  });

  popCookie.addEventListener('popup-close', () => {
    popCookie.hide();
  });
})
