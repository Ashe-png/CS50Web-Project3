document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      
    emails.forEach(singleEmail => {

      // console.log(singleEmail)

      
      const newEmail = document.createElement('div');
      newEmail.className = 'single_email_unread';
      newEmail.innerHTML = mailbox === 'sent' ? `
        <p>${singleEmail.recipients} </p>
        <strong>${singleEmail.subject} </strong>
        <p>${singleEmail.timestamp}</p>
      ` : `
        <p>${singleEmail.sender} </p>
        <strong>${singleEmail.subject} </strong>
        <p>${singleEmail.timestamp}</p>
      `;
      newEmail.className = singleEmail.read ? 'single_email_read': 'single_email_unread'

      newEmail.addEventListener('click', function () {
        email_view(singleEmail.id, mailbox);
      });
      document.querySelector('#emails-view').append(newEmail);      
      
    })

      // ... do something else with emails ...
  });

}



function send_email(event){
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method:'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });


}

function email_view(id, mailbox) {
  

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-detail').style.display = 'block';


      document.querySelector('#email-detail').innerHTML = `
      <ul class="list-group" >
        <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
        <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
        <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
        <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
      </ul>
      <div class='emailBody'>${email.body}<div>
      `;

      if(!email.read){

        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })

      }
      if (mailbox !== 'sent') {

        const arch_btn = document.createElement('button');
        arch_btn.className = email.archived ? 'btn btn-warning mt-2' : 'btn btn-success mt-2';
        arch_btn.id = 'arch_btn';
        arch_btn.innerHTML = email.archived ? 'Unarchive' : 'Archive';
        arch_btn.addEventListener('click', function() {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
          })
          let current = document.querySelector('#arch_btn').innerHTML;
          if (current === 'Unarchive') {
            document.querySelector('#arch_btn').innerHTML = 'Archive';
            document.querySelector('#arch_btn').className = 'btn btn-success mt-2';
          }
          else {
            document.querySelector('#arch_btn').innerHTML = 'Unarchive';
            document.querySelector('#arch_btn').className = 'btn btn-warning mt-2';
          }
          
        });
        document.querySelector('#email-detail').append(arch_btn);

        const reply_btn = document.createElement('button');
        reply_btn.className ='btn btn-info mt-2 mx-2';
        reply_btn.id = 'reply_btn';
        reply_btn.innerHTML = 'Reply';
        reply_btn.addEventListener('click', function() {
          compose_email();
          
          document.querySelector('#compose-recipients').value = email.sender;
          let subject = email.subject;
      
          if (subject.split(' ',1)[0] !=='Re:') {
            subject = 'Re: ' + email.subject;
          }
          document.querySelector('#compose-subject').value = subject;
          document.querySelector('#compose-body').value = `\n On ${email.timestamp} ${email.sender} wrote: ${email.body} \n`;
        
        });
        document.querySelector('#email-detail').append(reply_btn);
      }     
  });

  
}