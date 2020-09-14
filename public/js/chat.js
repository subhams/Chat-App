const socket = io()

//Elements

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search,{ ignoreQueryPrefix : true})
const a = Qs.parse(location.search, {ingoreQueryPrefix : true})
console.log(a.username + '   ' + a.room)
console.log(location.search)

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message)=> {
    console.log(message)
    const html = Mustache.render(messageTemplate, { 
        username: message.username,
        message: message.text,
        createdAt : moment(message.createdAt).format('h: mm: a')
     })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
}) 

socket.on('locationMessage', (message)=> {
    console.log(message.url)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        message : message.url,
        createdAt : moment(message.createdAt).format('h: mm: a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
    // const html = Mustache.render(messageTemplate, { message })
    // $messages.insertAdjacentHTML('beforeend', html)
}) 

socket.on('roomData', ({room, users})=> {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //disable form
    $messageFormButton.setAttribute('disabled','disabled')
    
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error)=> {
        
        //enable form
        $messageFormButton.removeAttribute('disabled')

        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('Message delivered.')
    })

})

$sendLocationButton.addEventListener('click', () => {
  
   if(!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
   }
   $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=> {
        socket.emit('sendLocation', {latitude : position.coords.latitude, longitude : position.coords.longitude}, ()=> {
        console.log('Location shared')
        $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username, room}, (error)=> {
    if(error){
        alert(error)
        location.href = '/'
    }
})

//https://google.com.maps?q=0,0

// socket.on('countUpdated',(count)=> {
//     console.log('The count has been updated to ' + count)
// })

// document.querySelector('#increment').addEventListener('click', ()=> {
//     console.log('Clicked')
//     socket.emit('increment')
// })
