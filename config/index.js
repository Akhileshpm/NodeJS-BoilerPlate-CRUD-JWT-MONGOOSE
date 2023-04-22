import keysProd from './prod';
import keysDev from './dev'

export default process.env.NODE_ENV === "production" ? keysProd : keysDev;
