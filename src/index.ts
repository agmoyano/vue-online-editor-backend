import { Server } from 'socket.io'
import { User } from './types/UserType'
import { RegistryRecord } from './types/RegistryType'
import { CursorPosition } from './types/CursorType'
import { Col } from './types/DocumentType'

export const io = new Server({
  cors: {
    origin: '*',
  },
})

const centralRegistry:Map<string, RegistryRecord> = new Map()


io.on('connection', (socket) => {
  let user:User

  console.log(socket.id)

  socket.on('message', (...args:unknown[]) => {
    console.log(args)
  })

  socket.on('disconnect', () => {
    console.log(`user ${user?.nickname} disconnected`)
  })

  socket.on('join:user', (remoteUser:User, callback:() => void) => {
    user = remoteUser
    console.log(user)
    callback()
    const registries = Array.from(centralRegistry.values()).filter(record => (record.users ?? []).find(u => u && u.id === user?.id))
    
    for(const record of registries) {
        socket.join(`document:${record.id}`)
    }
    socket.emit('user:registries', registries)
  })


  socket.on('join:active', (id:string, callback:(registry?:RegistryRecord)=>void) => {
    console.log(`user ${user?.nickname} joined room active:${id}`)
    socket.join(`active:${id}`)
    socket.leave(`document:${id}`)
    const record = centralRegistry.get(id)
    if(record && !record.users.find(u => u.id === user?.id)) {
      record.users.push(user)
      centralRegistry.set(id, record)
      socket.to(`document:${id}`).emit('update:document:registry', record, user)
      socket.to(`active:${id}`).emit('update:active:users', id, user)
    }
    callback(record)
  })

  socket.on('leave:active', (id:string, callback:()=>void) => {
    console.log(`user ${user?.nickname} left room active:${id}`)
    socket.leave(`active:${id}`)
    socket.join(`document:${id}`)
    callback()
  })

  socket.on('update:document:registry', (id:string, registry:RegistryRecord, callback:()=>void) => {
    console.log(`user ${user?.nickname} updated registry document:${id}`)
    centralRegistry.set(id, registry)
    callback()
    socket.join(`document:${id}`)
    socket.to(`document:${id}`).emit('update:document:registry', registry, user)
  })

  socket.on('update:active:position', (id:string, position:CursorPosition, callback:()=>void) => {
    console.log(`user ${user?.nickname} updated position active:${id}`)
    socket.to(`active:${id}`).emit('update:active:position', id, position, user)
    callback()
  })

  socket.on('add:active:column', (id:string, cols:Col[], pos:CursorPosition, callback:()=>void) => {
    console.log(`user ${user?.nickname} added column active:${id}`)
    socket.to(`active:${id}`).emit('add:active:column', id, cols, pos, user)
    callback()
  })

  socket.on('remove:active:column', (id:string, start:CursorPosition, end:CursorPosition, callback:()=>void) => {
    console.log(`user ${user?.nickname} removed column active:${id}`)
    socket.to(`active:${id}`).emit('remove:active:column', id, start, end, user)
    callback()
  })

  socket.on('update:active:selection', (id:string, start:CursorPosition, end:CursorPosition, callback:()=>void) => {
    console.log(`user ${user?.nickname} updated selection active:${id}`)
    socket.to(`active:${id}`).emit('update:active:selection', id, start, end, user)
    callback()
  })
  // socket.on('join:document', (id:string) => {
  //   console.log(`user ${user?.nickname} joined room document:${id}`)
  //   socket.join(`document:${id}`)
  // })

  // socket.on('leave:document', (id:string) => {
  //   console.log(`user ${user?.nickname} left room document:${id}`)
  //   socket.leave(`document:${id}`)
  // })
})

io.listen(3000)