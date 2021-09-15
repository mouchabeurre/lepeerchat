import { Component, OnInit, Input } from "@angular/core"

enum ElementType {
  text = "text",
  link = "link"
}

interface BaseElement {
  type: ElementType
  data: string
}

const linkRegex = new RegExp(
  /^(https?\:\/\/)?www\.[^\s]+((\.[a-z]{2,6})|(\:\d{1,5}))\/?([^\s]+)?$/
)

@Component({
  selector: "app-rich-message-content",
  templateUrl: "./rich-message-content.component.html",
  styleUrls: ["./rich-message-content.component.sass"]
})
export class RichMessageContentComponent implements OnInit {
  @Input("content") rawContent: string

  space: string = " "
  elements: BaseElement[] = []
  elementType = ElementType

  constructor() {}

  ngOnInit(): void {
    const splitElements: BaseElement[] = []
    const words = this.rawContent.split(this.space)
    for (const word of words) {
      let element: BaseElement
      if (word.match(linkRegex)) {
        element = { type: ElementType.link, data: word }
      } else {
        element = { type: ElementType.text, data: word }
      }
      splitElements.push(element)
    }
    this.elements = splitElements.reduce<BaseElement[]>((prev, curr) => {
      const last = prev[prev.length - 1]
      if (last?.type === curr.type) {
        last.data += this.space + curr.data
        return prev
      }
      return [...prev, curr]
    }, [])
  }
}
