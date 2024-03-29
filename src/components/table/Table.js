import ExcelComponent from '@core/ExcelComponent';
import $ from '@core/DOM';
import parse from '@core/utils/parse';
import actions from '@/store/actions';
import createTable from '@/components/table/table.template';
import resizeHandler from '@/components/table/table.resize';
import {
  isCell,
  matrix,
  nextSelector,
  shouldResize
} from '@/components/table/table.functions';
import TableSelection from '@/components/table/TableSelection';
import { defaultStyles } from '@core/utils/const';

export default class Table extends ExcelComponent {
  static className = 'excel__table';

  constructor($root, options) {
    super($root, {
      name: 'Table',
      listeners: ['mousedown', 'keydown', 'input'],
      ...options
    });
  }

  toHTML() {
    return createTable(20, this.store.getState());
  }

  prepare() {
    this.selection = new TableSelection();
  }

  init() {
    super.init();

    this.selectCell(this.$root.find('[data-id="0:0"]'));

    this.$on('formula:input', value => {
      this.selection.current
        .attr('data-value', value)
        .text(parse(value) || '');
      this.updateCellState(value);
    });

    this.$on('formula:done', () => {
      this.selection.current.focus();
    });

    this.$on('toolbar.applyStyle', value => {
      this.selection.applyStyle(value);
      this.$dispatch(actions.applyStyles({
        value,
        ids: this.selection.selectedIds
      }));
    });
  }

  selectCell($cell) {
    const styles = $cell.getStyles(Object.keys(defaultStyles));
    this.selection.select($cell);
    this.$emit('table:select', $cell);
    this.$dispatch(actions.changeStyles(styles));
  }

  async resizeTable(event) {
    try {
      const data = await resizeHandler(this.$root, event);
      this.$dispatch(actions.tableResize(data));
    } catch (error) {
      console.warn('Resize error: ', error.message);
    }
  }

  updateCellState(value) {
    this.$dispatch(actions.changeText({
      id: this.selection.current.id(),
      value
    }));
  }

  onMousedown(event) {
    if (shouldResize(event)) {
      this.resizeTable(event);
    } else if (isCell(event)) {
      const $target = $(event.target);
      if (event.shiftKey) {
        const $cells = matrix(this.selection.current, $target)
          .map(id => this.$root.find(`[data-id="${id}"]`));

        this.selection.selectGroup($cells);
      } else {
        this.selectCell($target);
      }
    }
  }

  onKeydown(event) {
    const keys = ['Enter', 'Tab', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
    const { key } = event;

    if (keys.includes(key) && !event.shiftKey) {
      event.preventDefault();

      const id = this.selection.current.id(true);
      const $nextCell = this.$root.find(nextSelector(key, id));
      this.selectCell($nextCell);
    }
  }

  onInput(event) {
    this.updateCellState($(event.target).text());
  }
}
