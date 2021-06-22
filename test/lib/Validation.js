'use strict';

/**
 * @module test/lib/Validation
*/

/**
 * Util Class for handling error message extraction and filtering.
*/
module.exports = class {
  /**
   * Creates a copy of a validation object and filters out unwanted keys.
   * @param {object} valMsgs - validation object containing validation messages of a model.
   * @param {object} props - validation properties to filter out.
   * @return {object} filtered validation object.
  */
  static withoutVal(valMsgs, { props=[] }={}) {
    return Object.keys(valMsgs)
      .filter(k => props.indexOf(k) < 0)
      .reduce((acc, curr) => ({ ...acc, ...{[curr]: valMsgs[curr]} }), {});
  }

  /**
   * Gets desired validation messages, filtering nested validation keys.
   * @param {object} valMsgs - validation object containing validation messages of a model.
   * @param {object} sansNested - nested validation properties to filter out.
   * @return {object} array of filtered validation messages.
  */
  static getValMsgs(valObjs, { sansNestedKeys=[], sorted=false }={}) {
    const valObjKeys = Object.keys(valObjs), msgs = [];

    valObjKeys.forEach(k => {
      let nestedKeys = Object.keys(valObjs[k]);

      sansNestedKeys && (
        nestedKeys = nestedKeys.filter(nk => 
          !sansNestedKeys.find(snk => new RegExp(`^${snk}`, 'g').test(nk)))
        );
      nestedKeys.forEach(nk => msgs.push(valObjs[k][nk]));
    });

    return sorted ? msgs.sort() : msgs;
  }
}
