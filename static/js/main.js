;(function() {
  const idInput = document.querySelector('#id')
  const requiredMessage = document.querySelector('.requiredMessage')
  const uriInput = document.querySelector('#content_uri')
  const noteInput = document.querySelector('#content_note')

  let userTypedInput = false

  function setPasswordGroupVisibility(displayed) {
    requiredMessage.style.display = displayed ? '' : 'none'
  }

  function submitForm() {
    document.querySelector('form').submit()
  }

  async function checkIfShouldShowPasswordRequired() {
    const id = idInput.value
    if (id) {
      try {
        const locked = await fetch(`/${id}/locked`).then(resp => resp.text())
        return +locked > 0
      } catch (e) {
        // shouldn't happen, but just in case, reveal the password field
        return true
      }
    } else {
      return false
    }
  }

  async function populateContentForExistingNote() {
    const id = idInput.value
    if (id) {
      try {
        const content = await fetch(`/${id}/content`).then(resp => resp.json())
        if (content['type'] == 'none') {
          if (!userTypedInput) {
            uriInput.value = ''
            noteInput.value = ''
          }
          return
        }

        if (userTypedInput) {
          const replace = confirm(
            `Do you want to replace what you've typed with the existing content for id ${id}?`
          )
          if (!replace) {
            return
          }
        }

        if (content['type'] == 'note') {
          uriInput.value = ''
          noteInput.value = content['content']
        } else if (content['type'] == 'uri') {
          uriInput.value = content['content']
          noteInput.value = ''
        }

        userTypedInput = false
      } catch (e) {
        console.error(`Error fetching content for preexisting note: ${e}`)
      }
    }
  }

  function handleKeydown(evt) {
    if (evt.key === 'Tab' && !evt.shiftKey) {
      evt.preventDefault()
      const idx = evt.target.selectionStart
      if (idx !== null) {
        const front = evt.target.value.substr(0, idx)
        const back = evt.target.value.substr(idx)
        evt.target.value = front + '    ' + back
        evt.target.setSelectionRange(idx + 4, idx + 4)
      }
    }

    // metaKey detects the command key on macOS
    if (evt.key === 'Enter' && (evt.ctrlKey || evt.metaKey)) {
      submitForm()
    }
  }

  function debounce(fn, duration) {
    let timeout = undefined
    return () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(fn, duration)
    }
  }

  const onIdInput = async () => {
    const [showPasswordRequired, _] = [
      await checkIfShouldShowPasswordRequired(),
      await populateContentForExistingNote()
    ]
    setPasswordGroupVisibility(showPasswordRequired)
  }

  setPasswordGroupVisibility(false)
  idInput.addEventListener('input', debounce(onIdInput, 400))
  uriInput.addEventListener('input', () => {
    userTypedInput = uriInput.value.length > 0
  })
  noteInput.addEventListener('input', () => {
    userTypedInput = noteInput.value.length > 0
  })
  noteInput.addEventListener('keydown', handleKeydown)

  function expandTextarea(evt) {
    evt.preventDefault()
    const lastHeight = noteInput.getBoundingClientRect().height
    noteInput.style.height = `${lastHeight + 150}px`
  }
  document
    .getElementById('expandNoteButton')
    .addEventListener('click', expandTextarea)

  document.addEventListener('DOMContentLoaded', () => {
    // allow for zane.zone/#<:slug> to go straight to editing
    if (window.location.hash.length > 1) {
      const noteToEdit = window.location.hash.substr(1)
      idInput.value = noteToEdit
      onIdInput()
    }
  })
})()
