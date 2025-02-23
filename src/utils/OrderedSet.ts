export class OrderedSet<T> implements Set<T> {
  private items: T[] = [];
  private itemSet: Set<T> = new Set();

  add(item: T): this {
    if (!this.itemSet.has(item)) {
      this.items.push(item);
      this.itemSet.add(item);
    }

    return this;
  }

  delete(item: T): boolean {
    if (this.itemSet.has(item)) {
      this.itemSet.delete(item);
      this.items = this.items.filter(i => i !== item);
      return true;
    }
    return false;
  }

  has(item: T): boolean {
    return this.itemSet.has(item);
  }

  indexOf(item: T): number {
    return this.items.indexOf(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  get size(): number {
    return this.items.length;
  }

  forEach(
    callbackfn: (value: T, value2: T, set: Set<T>) => void,
    thisArg?: unknown,
  ): void {
    for (const item of this.items) {
      callbackfn.call(thisArg, item, item, this);
    }
  }

  entries(): SetIterator<[T, T]> {
    return this.items.map(item => [item, item] as [T, T])[Symbol.iterator]();
  }

  keys(): SetIterator<T> {
    return this.items[Symbol.iterator]();
  }

  values(): SetIterator<T> {
    return this.items.values();
  }

  toArray(): T[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
    this.itemSet.clear();
  }

  [Symbol.iterator](): SetIterator<T> {
    return this.items[Symbol.iterator]();
  }

  [Symbol.toStringTag]: string = 'OrderedSet';
}
