export interface DataCreateRoomOut {
  roomName: string
  username: string
}

export interface DataCreateRoomInOk {
  token: string
  roomName: string
  roomId: string
  userId: string
  username: string
}
