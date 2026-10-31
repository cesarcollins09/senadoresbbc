(() => {
  'use strict';
  const { CMS, createClass, h } = window;
  if (!CMS || !createClass || !h) throw new Error('Decap CMS no está disponible.');

  // Optional strings need an explicit null to preserve the existing JSON contract.
  const NullableString = createClass({
    handleChange(event) {
      this.props.onChange(event.target.value === '' ? null : event.target.value);
    },
    render() {
      return h('input', { id: this.props.forID, className: this.props.classNameWrapper, type: 'text', value: this.props.value == null ? '' : this.props.value, onChange: this.handleChange });
    }
  });
  const NullableInteger = createClass({
    handleChange(event) {
      const raw = event.target.value;
      this.props.onChange(raw === '' ? null : Number(raw));
    },
    isValid() {
      const value = this.props.value;
      return value == null || (Number.isInteger(value) && value >= 0) || { error: { message: 'Usa un entero igual o mayor que 0, o deja el campo vacío.' } };
    },
    render() {
      return h('input', { id: this.props.forID, className: this.props.classNameWrapper, type: 'number', min: 0, step: 1, value: this.props.value == null ? '' : this.props.value, onChange: this.handleChange });
    }
  });
  CMS.registerWidget('nullable-string', NullableString);
  CMS.registerWidget('nullable-integer', NullableInteger);

  // Decap can omit a cleared optional field. Restore explicit nulls before writing JSON.
  CMS.registerEventListener({
    name: 'preSave',
    handler: ({ entry }) => {
      let data = entry.get('data');
      const nullIfEmpty = (record, key) => record.get(key) == null || record.get(key) === '' ? record.set(key, null) : record;
      if (data.has('players')) {
        data = data.update('players', players => players.map(player => ['number', 'birthdate', 'photo'].reduce(nullIfEmpty, player)));
      }
      if (data.has('games')) {
        data = data.update('games', games => games.map(game => ['home', 'away'].reduce((result, side) => result.update(side, team => nullIfEmpty(team, 'score')), game)));
      }
      if (data.has('departments')) {
        data = data.update('departments', departments => departments.map(department => department.update('leaders', leaders => leaders.map(leader => leader.update('players', players => players.map(player => nullIfEmpty(player, 'photo')))))));
      }
      return data;
    }
  });
})();
