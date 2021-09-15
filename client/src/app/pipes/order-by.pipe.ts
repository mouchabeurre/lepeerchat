import { Pipe, PipeTransform } from "@angular/core"

@Pipe({
  name: "orderBy"
})
export class OrderByPipe implements PipeTransform {
  transform(
    list: any[] | null,
    column: string,
    order: "ASC" | "DESC" = "ASC"
  ): any[] {
    if (list === null) {
      return []
    }
    return list.sort((a, b) => {
      if (a[column] > b[column]) {
        return order === "ASC" ? 1 : -1
      }
      if (a[column] < b[column]) {
        return order === "ASC" ? -1 : 1
      }
      return 0
    })
  }
}
