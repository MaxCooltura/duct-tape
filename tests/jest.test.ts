test('resolves to lemon', () => {
    // make sure to add a return statement
    return expect(Promise.resolve('lemon')).resolves.toBe('lemon');
});
