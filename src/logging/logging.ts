const CssLog = {
  successTimed: (text: string, start: number, ref?: string) => {
    const duration = (performance.now() - start).toFixed(2);
    return [
      `%c✓%c ${text} (${duration} ms) %c${ref ?? ''}`,
      'color: green',
      'color: white',
      'color: gray',
    ];
  },
};

export default CssLog;
