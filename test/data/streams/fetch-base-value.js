import {of as observableOf} from 'rxjs';
import {delay} from 'rxjs/operators';

import hot from '../../util/hot';

// Simulated external data source
export default function fetchBaseValue() {
    return hot(observableOf(5).pipe(delay(50)));
}
