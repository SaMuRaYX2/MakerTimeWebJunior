$(document).ready(function() {
  let notes = JSON.parse(localStorage.getItem('myNotes')) || [];
  let editingNoteId = null;
  let currentNoteType = 'text'; // За замовчуванням створюємо текст

  function saveToLocalStorage() {
      localStorage.setItem('myNotes', JSON.stringify(notes));
  }

  function renderNotes() {
      $('#notes-container').empty();
      notes.forEach(function(note, index) {
          let archiveClass = note.isArchived ? 'archived' : '';
          
          // Формуємо вміст нотатки (текст або список)
          let contentHTML = '';
          if (note.type === 'list') {
              contentHTML = '<ul class="note-list">';
              note.items.forEach(function(item, itemIndex) {
                  let checked = item.done ? 'checked' : '';
                  let strikeClass = item.done ? 'class="done"' : '';
                  contentHTML += `
                      <li>
                          <input type="checkbox" class="list-checkbox" data-note="${index}" data-item="${itemIndex}" ${checked}>
                          <span ${strikeClass}>${item.text}</span>
                      </li>
                  `;
              });
              contentHTML += '</ul>';
          } else {
              contentHTML = `<div class="note-content-text">${note.text}</div>`;
          }

          let noteHTML = `
              <div class="note ${archiveClass}" data-id="${index}">
                  <h3>${note.title}</h3>
                  ${contentHTML}
                  <div class="note-footer">
                      <span>${note.date}</span>
                      <div class="note-actions">
                          <button class="edit-btn" title="Редагувати"><i class="fas fa-edit"></i></button>
                          <button class="archive-btn" title="Архівувати"><i class="fas fa-archive"></i></button>
                          <button class="delete-btn" title="Видалити"><i class="fas fa-trash"></i></button>
                      </div>
                  </div>
              </div>
          `;
          $('#notes-container').append(noteHTML);
      });
  }

  // --- ЛОГІКА МОДАЛЬНОГО ВІКНА ---
  function resetModal() {
      $('#modal-title').val('');
      $('#modal-text').val('');
      $('#list-items-container').empty();
      setNoteType('text'); // Скидаємо на текстовий тип
  }

  function setNoteType(type) {
      currentNoteType = type;
      if (type === 'text') {
          $('#modal-text').show();
          $('#modal-list').hide();
          $('#toggle-type-btn').html('<i class="fas fa-list-ul"></i> Зробити списком завдань');
      } else {
          $('#modal-text').hide();
          $('#modal-list').show();
          $('#toggle-type-btn').html('<i class="fas fa-align-left"></i> Повернути звичайний текст');
          if ($('#list-items-container').children().length === 0) {
              addListItemInput(); // Додаємо один порожній інпут
          }
      }
  }

  function addListItemInput(text = '', done = false) {
      let doneData = done ? 'true' : 'false';
      let itemHTML = `
          <div class="modal-list-item">
            <i class="fas fa-dot-circle" style="color: rgb(189, 218, 0); margin-right: 10px"></i>
            <input type="text" class="list-item-val" placeholder="Пункт завдання..." value="${text}" data-done="${doneData}">
            <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
          </div>
      `;
      $('#list-items-container').append(itemHTML);
  }

  // Відкриття модалки по плюсику
  $('#open-modal-btn').click(function() {
      editingNoteId = null;
      resetModal();
      $('.modal').css('display', 'flex');
  });

  // Перемикання Текст/Список всередині модалки
  $('#toggle-type-btn').click(function() {
      setNoteType(currentNoteType === 'text' ? 'list' : 'text');
  });

  $('#add-list-item-btn').click(function() { addListItemInput(); });
  $(document).on('click', '.remove-item-btn', function() { $(this).closest('.modal-list-item').remove(); });

  // Закриття модалки
  $('.mac-close').click(function() { $('.modal').css('display', 'none'); });
  $(window).click(function(event) { if ($(event.target).is('.modal')) $('.modal').css('display', 'none'); });


  // Розгортання модального вікна
  $('.mac-maximize').click(function(){
    $('.modal-content').toggleClass('fullscreen');
  });

  // для логіки згортання вікна в мінімальне
  $('.mac-minimize').click(function(){
    $('.modal-content').addClass('minimized');
  });

  // Логіка перетягування вікна
  let isDragging = false;                                         
    let startX, startY, startLeft, startTop;                        
                                                                    
    // 1. Натиснули на мінімізоване вікно                           
    $('.modal-content').on('mousedown', function(e) {               
      if (!$(this).hasClass('minimized')) return; // тільки в мінімізованому стані                                              
                                                                    
      isDragging = true;                                            
      startX = e.clientX;           // де курсор зараз              
      startY = e.clientY;                                           
      startLeft = $(this).offset().left;  // де вікно зараз         
      startTop = $(this).offset().top;                              
    });                                                             
                                                                    
    // 2. Рухаємо мишку                                             
    $(document).on('mousemove', function(e) {                       
      if (!isDragging) return;                                      
                                                                    
      let dx = e.clientX - startX;  // наскільки перемістився курсор                                                            
      let dy = e.clientY - startY;                                  
                                                                    
      $('.modal-content').css({                                     
        position: 'fixed',                                          
        left: startLeft + dx,                                       
        top: startTop + dy                                          
      });                                                           
    });                                                             
                                                                    
    // 3. Відпустили мишку                                          
    $(document).on('mouseup', function() {                          
      isDragging = false;                                           
    }); 

    $('.restore-btn').click(function() {                            
        $('.modal-content').removeClass('minimized');                               
        // повертаємо позицію в центр                                 
      }); 


  // --- ЗБЕРЕЖЕННЯ ---
  $('#save-note-btn').click(function() {
      let titleVal = $('#modal-title').val().trim();
      
      let newNoteData = {
          title: titleVal,
          type: currentNoteType,
          isArchived: editingNoteId !== null ? notes[editingNoteId].isArchived : false,
          date: editingNoteId !== null ? notes[editingNoteId].date : new Date().toLocaleString('uk-UA', {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'})
      };

      if (currentNoteType === 'text') {
          let textVal = $('#modal-text').val();
          if (textVal.trim() === '') { alert('Текст не може бути порожнім!'); return; }
          newNoteData.text = textVal;
      } else {
          let items = [];
          $('.list-item-val').each(function() {
              let val = $(this).val().trim();
              let isDone = $(this).attr('data-done') === 'true';
              if (val !== '') items.push({ text: val, done: isDone });
          });
          if (items.length === 0) { alert('Додайте хоча б один пункт!'); return; }
          newNoteData.items = items;
      }

      if (editingNoteId !== null) { notes[editingNoteId] = newNoteData; } 
      else { notes.push(newNoteData); }

      saveToLocalStorage();
      renderNotes();
      $('.modal').css('display', 'none');
  });

  // --- РЕДАГУВАННЯ ---
  $(document).on('click', '.edit-btn', function() {
      editingNoteId = $(this).closest('.note').data('id');
      let note = notes[editingNoteId];
      resetModal();
      $('#modal-title').val(note.title);
      
      if (note.type === 'list') {
          setNoteType('list');
          $('#list-items-container').empty();
          note.items.forEach(item => addListItemInput(item.text, item.done));
      } else {
          setNoteType('text');
          $('#modal-text').val(note.text);
      }
      $('.modal').css('display', 'flex');
  });

  // --- КЛІК ПО ЧЕКБОКСУ НА ЕКРАНІ ---
  $(document).on('change', '.list-checkbox', function() {
      let noteId = $(this).data('note');
      let itemId = $(this).data('item');
      notes[noteId].items[itemId].done = $(this).is(':checked');
      saveToLocalStorage();
      renderNotes();
  });

  // --- ВИДАЛЕННЯ ТА АРХІВУВАННЯ ---
  $(document).on('click', '.delete-btn', function() {
      notes.splice($(this).closest('.note').data('id'), 1);
      saveToLocalStorage(); renderNotes();
  });

  $(document).on('click', '.archive-btn', function() {
      let noteId = $(this).closest('.note').data('id');
      notes[noteId].isArchived = !notes[noteId].isArchived; 
      saveToLocalStorage(); renderNotes();
  });

  renderNotes();
});