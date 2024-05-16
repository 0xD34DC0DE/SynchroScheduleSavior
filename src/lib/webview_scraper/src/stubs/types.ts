declare const stub: unique symbol;

type InjectableStub<T> = T & { [stub]: true };

export default InjectableStub;
