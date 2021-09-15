import { Injectable } from "@angular/core"
import { BehaviorSubject, Observable, Subject } from "rxjs"
import { first } from "rxjs/operators"
import { CacheManagerService } from "./cache-manager.service"

export enum ModalType {
  LEAVE_INTENT
}

export interface ModalDataLeaveIn {
  type: ModalType.LEAVE_INTENT
  roomName: string
  preventPrompt: boolean
}

export type ModalDataIn = ModalDataLeaveIn

export interface ModalDataBaseOut {
  result: boolean
}

export type ModalDataLeaveOut = ModalDataBaseOut & {
  preventPrompt?: boolean
}

export type ModalDataOut = ModalDataLeaveOut | ModalDataBaseOut

@Injectable({
  providedIn: "root"
})
export class ModalDialogService {
  private _resultSubject$: Subject<ModalDataOut>
  private _dataSubject$: BehaviorSubject<ModalDataIn | null>

  constructor(private _cacheManagerService: CacheManagerService) {
    this._resultSubject$ = new Subject()
    this._dataSubject$ = new BehaviorSubject(null)
  }

  private _canOpenDialog() {
    return new Promise((resolve, reject) => {
      this._dataSubject$.pipe(first()).subscribe({
        next: oldData => {
          if (oldData !== null) {
            reject()
          } else {
            resolve()
          }
        }
      })
    })
  }

  getDataSubject(): Observable<ModalDataIn | null> {
    return this._dataSubject$
  }

  openRoomLeaveDialog(roomId: string): Promise<ModalDataLeaveOut> {
    return new Promise((resolve, reject) => {
      this._canOpenDialog()
        .then(() => {
          const {
            roomName,
            preventPromptLeave
          } = this._cacheManagerService.getRoom(roomId)!
          this._dataSubject$.next(<ModalDataLeaveIn>{
            type: ModalType.LEAVE_INTENT,
            roomName,
            preventPrompt: preventPromptLeave ?? false
          })
          this._resultSubject$.pipe(first()).subscribe({
            next: result => {
              this._dataSubject$.next(null)
              resolve(result)
            }
          })
        })
        .catch(() => reject())
    })
  }

  resolveModal(result: ModalDataOut) {
    this._resultSubject$.next(result)
  }
}
