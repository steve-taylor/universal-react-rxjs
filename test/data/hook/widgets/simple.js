import {widget} from '../../../../src';

import context from '../../context/simple-context';
import getData from '../../widget-streams/simple';
import component from '../components/simple';

export default widget({
    name: 'simple--hooked',
    component,
    context,
    getData,
});
